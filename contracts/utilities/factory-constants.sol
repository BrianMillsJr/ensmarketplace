pragma solidity ^0.7.5;

library FactoryConstants {
    uint256 internal constant STORAGE_SLOT_REGISTRY_ADDRESS = 0;
    uint256 internal constant STORAGE_SLOT_OWNER_ADDRESS = 1;
    uint256 internal constant STORAGE_SLOT_ENS_TOKEN_ADDRESS = 2;
    uint256 internal constant STORAGE_SLOT_ENS_REGISTRY_ADDRESS = 3;
    uint256 internal constant STORAGE_SLOT_UPGRADE_NONCE_UINT = 0;
    uint256 internal constant STORAGE_SLOT_COMMISSION_RATE_UINT = 1;
    address internal constant ZERO_ADDRESS =
        address(0x0000000000000000000000000000000000000000);
}
