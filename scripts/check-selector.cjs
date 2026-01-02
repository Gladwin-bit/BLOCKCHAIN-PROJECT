const { ethers } = require("ethers");
console.log("Selector for getVerificationHistory(uint256):", ethers.id("getVerificationHistory(uint256)").slice(0, 10));
console.log("Selector for getProduct(uint256):", ethers.id("getProduct(uint256)").slice(0, 10));
console.log("Selector for getVerificationHistory(uint256) again:", ethers.keccak256(ethers.toUtf8Bytes("getVerificationHistory(uint256)")).slice(0, 10));
