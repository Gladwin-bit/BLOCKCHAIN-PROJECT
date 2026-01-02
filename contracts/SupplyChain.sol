// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SupplyChain
 * @dev Professional Supply Chain Smart Contract implementing RBAC, State Machines, 
 * and Event-Driven Arhcitecture for security and transparency.
 */
contract SupplyChain is AccessControl {
    
    // --- Phase 1: Access Control (RBAC) ---
    // Using bytes32 for performance and standardized role-based permissions
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER");
    bytes32 public constant DISTRIBUTOR_ROLE  = keccak256("DISTRIBUTOR");
    bytes32 public constant RETAILER_ROLE     = keccak256("RETAILER");

    // --- Phase 2: State Machine ---
    enum State { 
        Created,        // 0: Initial state by Manufacturer
        InTransit,      // 1: Moving between nodes
        AtRetailer,     // 2: Available at store
        Sold,           // 3: Digital ownership transferred to consumer
        InTransit_P2P   // 4: Secondary market resale flow
    }

    // --- Historical Audit Trail ---
    struct HistoryEntry {
        address actor;
        State state;
        uint256 timestamp;
        string location;
    }

    struct VerificationLog {
        address verifier;
        uint256 timestamp;
        string location;
        string remarks;
    }

    struct VerificationRecord {
        address verifier;
        uint256 time;
        bool isFirstClaim;
    }

    struct CustomerClaim {
        string customerName;
        string location;  // Latitude,Longitude format
        uint256 timestamp;
        address claimedBy;
        bool isClaimed;
    }

    struct Product {
        uint256 id;
        string name;
        address currentOwner; 
        State state;
        bytes32 currentSecretHash;  // Dynamic Secret Key Hash (Updates after every transfer)
        bytes32 currentHandoverHash; // Rolling Handover Hash (Dynamic QR for hops)
        bool exists;
        VerificationLog[] verificationHistory;
        CustomerClaim customerClaim;  // Customer ownership data
        string productCertificate;  // Product-specific certificate/warranty document filename
    }

    uint256 private _productCounter = 0;
    mapping(uint256 => Product) public products;
    mapping(uint256 => HistoryEntry[]) public productHistory;
    mapping(uint256 => VerificationRecord) public verifyLog; // First claim record

    // --- Phase 3: Event-Driven Architecture (Crucial for Tracing) ---
    // Indexed parameters allow for high-speed frontend filtering of large logs
    event ProductCreated(uint256 indexed id, address indexed manufacturer, string name);
    event HandoverGenerated(uint256 indexed id, address indexed from);
    event CustodyTransferred(uint256 indexed id, address indexed from, address indexed to, string location);
    event ProductClaimed(uint256 indexed id, address indexed newOwner);
    event ProductReverified(uint256 indexed id, address indexed verifier, uint256 timestamp, address originalOwner);
    event OwnershipTransferred(uint indexed id, address indexed from, address indexed to);
    event ProductVerified(uint256 indexed id, address indexed verifier, uint256 timestamp);
    event CustomerOwnershipClaimed(uint256 indexed id, address indexed customer, string customerName, string location, uint256 timestamp);

    // --- Modifiers for Clean Code & Logic Enforcement ---
    modifier onlyCurrentOwner(uint256 _id) {
        require(products[_id].currentOwner == msg.sender, "Access: Caller is not the current owner");
        _;
    }

    modifier inState(uint256 _id, State _state) {
        require(products[_id].state == _state, "Logic: Invalid state for this action");
        _;
    }

    modifier notSold(uint256 _id) {
        require(products[_id].state != State.Sold, "Security: Product already sold and claimed");
        _;
    }

    modifier productExists(uint256 _id) {
        require(products[_id].exists, "Lookup: Product ID does not exist");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANUFACTURER_ROLE, msg.sender);
    }

    /**
     * @notice Phase 1: Initiation
     * @dev Manufacturer creates the product item with an associated secret hash for the buy claim.
     */
    function createProduct(string calldata _name, bytes32 _secretHash, string calldata _productCertificate) 
        external 
        returns (uint256) 
    {
        _productCounter++;
        uint256 newId = _productCounter;

        Product storage newProduct = products[newId];
        newProduct.id = newId;
        newProduct.name = _name;
        newProduct.currentOwner = msg.sender;
        newProduct.state = State.Created;
        newProduct.currentSecretHash = _secretHash;
        newProduct.currentHandoverHash = bytes32(0);
        newProduct.exists = true;
        newProduct.productCertificate = _productCertificate;  // Store product certificate

        _pushHistory(newId, State.Created, "Factory");
        emit ProductCreated(newId, msg.sender, _name);
        return newId;
    }

    /**
     * @notice Task 1: Update Secret (Dynamic "Hot Potato" Logic)
     * @dev Used by Manufacturer/Distributor/Retailer to set the lock for the next person.
     */
    function updateSecret(uint256 _id, bytes32 _newHash) 
        external 
        productExists(_id)
        onlyCurrentOwner(_id)
        notSold(_id)
    {
        products[_id].currentSecretHash = _newHash;
        emit HandoverGenerated(_id, msg.sender); // Reuse or create new event if needed
    }

    /**
     * @notice Task 1: Verify & Claim (Last-Mile Secret Logic)
     * @dev Consumer takes final ownership or re-verifies authenticity.
     */
    function verifyAndClaim(uint256 _id, string memory _secretKey) 
        external 
        productExists(_id)
    {
        // 1. Check keccak256(_secretKey) == currentSecretHash
        require(keccak256(abi.encodePacked(_secretKey)) == products[_id].currentSecretHash, "Security: Invalid secret code provided");

        VerificationRecord storage record = verifyLog[_id];

        // 2. If Match: First time claim
        if (record.time == 0) {
            address prevOwner = products[_id].currentOwner;
            products[_id].currentOwner = msg.sender;
            products[_id].state = State.Sold;

            // Store block.timestamp and msg.sender in verifyLog
            record.verifier = msg.sender;
            record.time = block.timestamp;
            record.isFirstClaim = true;

            _pushHistory(_id, State.Sold, "End Consumer");
            emit ProductClaimed(_id, msg.sender);
            emit OwnershipTransferred(_id, prevOwner, msg.sender);
        } 
        // 3. If Match: Already claimed (Re-verification)
        else {
            emit ProductReverified(_id, msg.sender, record.time, record.verifier);
            // DO NOT REVERT. Just return status (handled by event and frontend)
        }
    }

    /**
     * @notice Rolling Handover: Phase A (Sender)
     * @dev Generates a rolling hash that the receiver must match.
     */
    function generateHandover(uint256 _id, bytes32 _newHash) 
        external 
        productExists(_id) 
        onlyCurrentOwner(_id) 
        notSold(_id)
    {
        products[_id].currentHandoverHash = _newHash;
        emit HandoverGenerated(_id, msg.sender);
    }

    /**
     * @notice Rolling Handover: Phase B (Receiver)
     * @dev Accepts custody by providing the secret key that matches currentHandoverHash.
     */
    function acceptHandover(uint256 _id, string memory _secretKey, bytes32 _nextHash, string memory _location) 
        external 
        productExists(_id) 
        notSold(_id)
    {
        require(keccak256(abi.encodePacked(_secretKey)) == products[_id].currentHandoverHash, "Security: Invalid handover pass provided");
        
        address prevOwner = products[_id].currentOwner;
        products[_id].currentOwner = msg.sender;
        
        // Rolling Logic: Update state based on receiver role (Optional/Role-based)
        if (hasRole(DISTRIBUTOR_ROLE, msg.sender)) {
            products[_id].state = State.InTransit;
        } else if (hasRole(RETAILER_ROLE, msg.sender)) {
            products[_id].state = State.AtRetailer;
        } else {
            products[_id].state = State.InTransit; // Default for partners
        }

        // Wipe old handover hash, set new rolling hash for the NEXT recipient
        products[_id].currentHandoverHash = _nextHash;
        
        _pushHistory(_id, products[_id].state, _location);
        emit CustodyTransferred(_id, prevOwner, msg.sender, _location);
    }

    /**
     * @notice Phase 3: Digital Ledger (P2P Resale)
     * @dev Proves the blockchain acts as a trustless ledger of ownership even after initial sale.
     */
    function transferOwnership(uint256 _id, address _to) 
        external 
        productExists(_id)
        onlyCurrentOwner(_id)
        inState(_id, State.Sold)
    {
        require(_to != address(0), "Logic: Invalid destination address");
        
        address from = products[_id].currentOwner;
        products[_id].currentOwner = _to;

        _pushHistory(_id, State.Sold, "Secondary Market");
        emit OwnershipTransferred(_id, from, _to);
    }

    /**
     * @notice Phase 4: Activity Log (Sign the Guestbook)
     * @dev Allows anyone to record a verification event for a product.
     */
    function recordVerification(uint256 _id, string calldata _location, string calldata _remarks) 
        external 
        productExists(_id) 
    {
        products[_id].verificationHistory.push(VerificationLog({
            verifier: msg.sender,
            timestamp: block.timestamp,
            location: _location,
            remarks: _remarks
        }));

        emit ProductVerified(_id, msg.sender, block.timestamp);
    }

    /**
     * @notice Customer Ownership Claim
     * @dev Allows a customer to claim ownership of a product with their name and location
     */
    function claimCustomerOwnership(
        uint256 _id, 
        string memory _secretKey, 
        string memory _customerName, 
        string memory _location
    ) 
        external 
        productExists(_id)
    {
        // Verify the secret code
        require(keccak256(abi.encodePacked(_secretKey)) == products[_id].currentSecretHash, "Security: Invalid secret code provided");
        
        // Check if already claimed
        require(!products[_id].customerClaim.isClaimed, "Product: Already claimed by a customer");
        
        // Update product ownership
        address prevOwner = products[_id].currentOwner;
        products[_id].currentOwner = msg.sender;
        products[_id].state = State.Sold;
        
        // Record customer claim
        products[_id].customerClaim = CustomerClaim({
            customerName: _customerName,
            location: _location,
            timestamp: block.timestamp,
            claimedBy: msg.sender,
            isClaimed: true
        });
        
        // Add to history
        _pushHistory(_id, State.Sold, _location);
        
        // Emit events
        emit CustomerOwnershipClaimed(_id, msg.sender, _customerName, _location, block.timestamp);
        emit OwnershipTransferred(_id, prevOwner, msg.sender);
    }

    // --- Internal Helpers ---

    function _pushHistory(uint256 _id, State _state, string memory _location) internal {
        productHistory[_id].push(HistoryEntry({
            actor: msg.sender,
            state: _state,
            timestamp: block.timestamp,
            location: _location
        }));
    }

    // --- View Functions ---

    function getHistory(uint256 _id) external view productExists(_id) returns (HistoryEntry[] memory) {
        return productHistory[_id];
    }

    function getVerificationHistory(uint256 _id) external view productExists(_id) returns (VerificationLog[] memory) {
        return products[_id].verificationHistory;
    }

    function getProduct(uint256 _id) external view returns (Product memory) {
        return products[_id];
    }
}

