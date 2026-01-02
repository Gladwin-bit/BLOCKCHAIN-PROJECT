const { ethers } = require("ethers");

const signatures = [
    "generateHandover(uint256,bytes32)",
    "acceptHandover(uint256,string,bytes32,string)",
    "updateSecret(uint256,bytes32)",
    "createProduct(string,bytes32)",
    "claimProduct(uint256,string)",
    "verifyAndClaim(uint256,string)",
    "transferOwnership(uint256,address)",
    "getProduct(uint256)",
    "getHistory(uint256)",
    "getVerificationHistory(uint256)",
    "recordVerification(uint256,string,string)",
    "verifyLog(uint256)",
    "hasRole(bytes32,address)",
    "grantRole(bytes32,address)",
    "revokeRole(bytes32,address)"
];

signatures.forEach(sig => {
    console.log(`${sig}: ${ethers.id(sig).slice(0, 10)}`);
});
