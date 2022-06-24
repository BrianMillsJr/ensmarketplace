pragma solidity ^0.7.5;

import "./multisig-entry.sol";

contract Structs is StructMultiSigEntry {
    struct SaleReceipt {
        uint256 price;
        uint256 commission;
        uint256 receiptNonce;
        uint256 expiry;
        string domain;
        address seller;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct LocalUpgrade {
        uint256 nonce;
        MultisigEntry signature;
    }
}
