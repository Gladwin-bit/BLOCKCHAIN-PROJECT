// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SupplyChain
 * @dev Kasaragod Saree Authenticity & Supply Chain Tracking Smart Contract.
 * Allows tracking from Weaver -> Cooperative -> Distributor -> Shop -> Customer.
 */
contract SupplyChain is AccessControl {
    
    // --- Phase 1: Access Control (RBAC) ---
    bytes32 public constant WEAVER_ROLE      = keccak256("WEAVER");
    bytes32 public constant COOPERATIVE_ROLE = keccak256("COOPERATIVE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR");
    bytes32 public constant SHOP_ROLE        = keccak256("SHOP");

    // --- Phase 2: State Machine ---
    enum State { 
        Created,        // 0: Created by Weaver
        Verified,       // 1: Verified by Cooperative
        InTransit,      // 2: Moving between nodes (Distributor/Shop)
        AtShop,         // 3: Available at Shop (Retailer)
        Sold,           // 4: Owned by Customer
        InTransit_P2P   // 5: Secondary market resale flow
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

    struct CustomerClaim {
        string customerName;
        string location;
        uint256 timestamp;
        address claimedBy;
        bool isClaimed;
    }

    struct Product {
        uint256 id;
        string name;            // Saree Name/Identifier
        string loomLocation;   // New: Specific Loom Location
        uint256 weaveDate;     // New: Date of Weaving
        address currentOwner; 
        State state;
        bytes32 consumerSecretHash;  // Scratch-off code hash
        bytes32 currentHandoverHash; // Rolling handover key hash
        bool isConsumed;             
        bool exists;
        VerificationLog[] verificationHistory; // Cooperative/Others verification
        CustomerClaim customerClaim;
        string productCertificate;  // IPFS Hash of Certificate
    }

    uint256 private _productCounter = 0;
    mapping(uint256 => Product) public products;
    mapping(uint256 => HistoryEntry[]) public productHistory;
    
    // User authorization certificates stored on IPFS
    mapping(address => string) public userCertificateIPFS;

    // --- Events ---
    event ProductCreated(uint256 indexed id, address indexed weaver, string name, string loomLocation);
    event ProductVerified(uint256 indexed id, address indexed verifier, uint256 timestamp);
    event CustodyTransferred(uint256 indexed id, address indexed from, address indexed to, string location);
    event OwnershipTransferred(uint indexed id, address indexed from, address indexed to);
    event CustomerOwnershipClaimed(uint256 indexed id, address indexed customer, string customerName, string location, uint256 timestamp);
    event UserCertificateRegistered(address indexed user, string ipfsHash);

    // --- Modifiers ---
    modifier onlyCurrentOwner(uint256 _id) {
        require(products[_id].currentOwner == msg.sender, "Access: Caller is not the current owner");
        _;
    }

    modifier inState(uint256 _id, State _state) {
        require(products[_id].state == _state, "Logic: Invalid state for this action");
        _;
    }

    modifier productExists(uint256 _id) {
        require(products[_id].exists, "Lookup: Product ID does not exist");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(WEAVER_ROLE, msg.sender);
    }

    /**
     * @notice Weaver Registers Saree
     * @param _name Saree Name
     * @param _loomLocation Location of the Loom
     * @param _weaveDate Timestamp of weaving completion
     * @param _consumerSecretHash Static scratch-off code hash
     * @param _firstHandoverHash Initial handover key hash
     * @param _productCertificate Certificate/warranty document filename (IPFS)
     */
    function createProduct(
        string calldata _name, 
        string calldata _loomLocation,
        uint256 _weaveDate,
        bytes32 _consumerSecretHash,
        bytes32 _firstHandoverHash,
        string calldata _productCertificate
    ) 
        external 
        onlyRole(WEAVER_ROLE)
        returns (uint256) 
    {
        _productCounter++;
        uint256 newId = _productCounter;

        Product storage newProduct = products[newId];
        newProduct.id = newId;
        newProduct.name = _name;
        newProduct.loomLocation = _loomLocation;
        newProduct.weaveDate = _weaveDate;
        newProduct.currentOwner = msg.sender;
        newProduct.state = State.Created;
        newProduct.consumerSecretHash = _consumerSecretHash;
        newProduct.currentHandoverHash = _firstHandoverHash;
        newProduct.isConsumed = false;
        newProduct.exists = true;
        newProduct.productCertificate = _productCertificate;

        _pushHistory(newId, State.Created, _loomLocation);
        emit ProductCreated(newId, msg.sender, _name, _loomLocation);
        return newId;
    }

    /**
     * @notice Cooperative Verifies Saree
     * @dev Cooperative verifies the Saree details and physical existence before distribution.
     * @param _id Product ID
     * @param _location Cooperative Location
     * @param _remarks Verification remarks
     */
    function verifyProduct(uint256 _id, string calldata _location, string calldata _remarks)
        external
        productExists(_id)
        onlyRole(COOPERATIVE_ROLE)
    {
        // Ideally, verification happens when it's still with Weaver or just handed over. 
        // We'll enforce it must be in Created state (or Verified if re-verifying, but let's keep it simple).
        require(products[_id].state == State.Created, "Logic: Product must be in Created state to verify");

        products[_id].state = State.Verified;

        products[_id].verificationHistory.push(VerificationLog({
            verifier: msg.sender,
            timestamp: block.timestamp,
            location: _location,
            remarks: _remarks
        }));

        _pushHistory(_id, State.Verified, _location); // Optional: Do we track verification in history as a state change? Yes.
        emit ProductVerified(_id, msg.sender, block.timestamp);
    }

    /**
     * @notice B2B Custody Transfer
     * @dev Weaver -> Distributor -> Shop
     */
    function transferCustody(
        uint256 _id, 
        string memory _incomingKey, 
        bytes32 _nextKeyHash, 
        string memory _location
    ) 
        external 
        productExists(_id) 
    {
        require(products[_id].state != State.Sold, "Security: Product already sold");

        // Verify: incoming key must match current handover hash
        require(
            keccak256(abi.encodePacked(_incomingKey)) == products[_id].currentHandoverHash, 
            "Security: Invalid handover key provided"
        );
        
        address prevOwner = products[_id].currentOwner;
        products[_id].currentOwner = msg.sender;
        
        // Update state logic
        if (hasRole(SHOP_ROLE, msg.sender)) {
            products[_id].state = State.AtShop;
        } else if (hasRole(DISTRIBUTOR_ROLE, msg.sender)) {
            products[_id].state = State.InTransit; 
        } else {
             // Fallback or intermediate
            products[_id].state = State.InTransit;
        }

        // ROLL THE KEY
        products[_id].currentHandoverHash = _nextKeyHash;
        
        _pushHistory(_id, products[_id].state, _location);
        emit CustodyTransferred(_id, prevOwner, msg.sender, _location);
    }

    /**
     * @notice Customer Claims Ownership
     */
    function claimOwnership(
        uint256 _id, 
        string memory _scratchCode, 
        string memory _customerName, 
        string memory _location
    ) 
        external 
        productExists(_id)
    {
        require(
            keccak256(abi.encodePacked(_scratchCode)) == products[_id].consumerSecretHash, 
            "Security: Invalid scratch-off code provided"
        );
        
        require(!products[_id].isConsumed, "Product: Already claimed");
        
        address prevOwner = products[_id].currentOwner;
        products[_id].currentOwner = msg.sender;
        products[_id].state = State.Sold;
        products[_id].isConsumed = true;
        
        products[_id].customerClaim = CustomerClaim({
            customerName: _customerName,
            location: _location,
            timestamp: block.timestamp,
            claimedBy: msg.sender,
            isClaimed: true
        });
        
        _pushHistory(_id, State.Sold, _location);
        emit CustomerOwnershipClaimed(_id, msg.sender, _customerName, _location, block.timestamp);
        emit OwnershipTransferred(_id, prevOwner, msg.sender);
    }

    // --- Helpers & Views ---

    function _pushHistory(uint256 _id, State _state, string memory _location) internal {
        productHistory[_id].push(HistoryEntry({
            actor: msg.sender,
            state: _state,
            timestamp: block.timestamp,
            location: _location
        }));
    }

    function getHistory(uint256 _id) external view productExists(_id) returns (HistoryEntry[] memory) {
        return productHistory[_id];
    }

    function getVerificationHistory(uint256 _id) external view productExists(_id) returns (VerificationLog[] memory) {
        return products[_id].verificationHistory;
    }

    function getProduct(uint256 _id) external view returns (Product memory) {
        return products[_id];
    }
    
    function registerUserCertificate(string calldata _ipfsHash) external {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        userCertificateIPFS[msg.sender] = _ipfsHash;
        emit UserCertificateRegistered(msg.sender, _ipfsHash);
    }

    function getUserCertificate(address _userAddress) external view returns (string memory) {
        return userCertificateIPFS[_userAddress];
    }
}
