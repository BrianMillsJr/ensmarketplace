pragma solidity ^0.7.5;

import "../../utilities/structs.sol";
import "../../utilities/factory-constants.sol";

contract Proxy is Structs {
    bool rentryGuardActive;
    mapping(uint256 => address) public addressStorage;
    mapping(uint256 => uint256) public uintStorage;
    mapping(address => mapping(bytes32 => uint256)) public receiptNonces;

    constructor(
        address initialRegistryAddress,
        address initialEnsRegistryAddress,
        address initialEnsTokenAddress,
        uint256 initialCommissionRate
    ) {
        addressStorage[
            FactoryConstants.STORAGE_SLOT_REGISTRY_ADDRESS
        ] = initialRegistryAddress;
        addressStorage[
            FactoryConstants.STORAGE_SLOT_ENS_REGISTRY_ADDRESS
        ] = initialEnsRegistryAddress;
        addressStorage[
            FactoryConstants.STORAGE_SLOT_ENS_TOKEN_ADDRESS
        ] = initialEnsTokenAddress;
        addressStorage[FactoryConstants.STORAGE_SLOT_OWNER_ADDRESS] = msg
            .sender;
        uintStorage[
            FactoryConstants.STORAGE_SLOT_COMMISSION_RATE_UINT
        ] = initialCommissionRate;
        uintStorage[FactoryConstants.STORAGE_SLOT_UPGRADE_NONCE_UINT] = 0;
    }

    receive() external payable {}

    fallback() external payable {
        bytes4 sig = bytes4(keccak256("f()"));
        address registry = addressStorage[
            FactoryConstants.STORAGE_SLOT_REGISTRY_ADDRESS
        ];
        address factory;
        assembly {
            let callPtr := mload(0x40)
            mstore(callPtr, sig)
            let callResult := call(
                8000000,
                registry,
                0,
                callPtr,
                0x4,
                callPtr,
                0x20
            )
            let callResultSize := returndatasize()
            returndatacopy(callPtr, 0, callResultSize)
            if eq(callResult, 0) {
                revert(callPtr, callResultSize)
            }
            factory := mload(callPtr)
            mstore(0x40, add(callPtr, 0x4))
            let delegateCallPtr := mload(0x40)
            calldatacopy(delegateCallPtr, 0, calldatasize())
            let delegatecallResult := delegatecall(
                gas(),
                factory,
                delegateCallPtr,
                calldatasize(),
                0,
                0
            )
            let delagateCallSize := returndatasize()
            returndatacopy(delegateCallPtr, 0, delagateCallSize)
            if eq(delegatecallResult, 0) {
                revert(delegateCallPtr, delagateCallSize)
            }
            return(delegateCallPtr, delagateCallSize)
        }
    }
}
