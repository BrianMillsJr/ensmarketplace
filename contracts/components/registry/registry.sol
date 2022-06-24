pragma solidity ^0.7.5;
pragma experimental ABIEncoderV2;

import "../../utilities/multisig-entry.sol";

contract Registry is StructMultiSigEntry {
    mapping(uint256 => address) public currentSettings;
    mapping(uint256 => address) public queuedUpgrades;
    mapping(uint256 => uint256) public upgradeTimelockSet;
    mapping(address => bool) public signers;

    uint256 upgradeNonce;
    uint256 signerCount;
    uint256 timelockDuration;
    uint256 timelockUpgradeStartSet;
    uint256 timelockDurationUpgrade;

    enum UpgradeTypes {
        SWITCH_TIMELOCK,
        SWITCH_SIGNER,
        SET_FACTORY,
        PERFORM_UPGRADE,
        CANCEL_QUEUED_UPGRADE
    }

    event upgradePerformed(
        string comment,
        address addressBasedUpgradeData,
        uint256 uintBasedUpgradeData,
        bool boolBasedUpgradeData
    );

    event upgradeFailed(
        string comment,
        address addressBasedUpgradeData,
        uint256 uintBasedUpgradeData,
        bool boolBasedUpgradeData,
        uint256 executableAtBlockNumber
    );

    event upgradeCanceled(
        string comment,
        address addressBasedUpgradeData,
        uint256 uintBasedUpgradeData,
        bool boolBasedUpgradeData,
        uint256 executableAtBlockNumber
    );

    constructor(uint256 initialTimelockDuration) {
        timelockDuration = initialTimelockDuration;
        signers[msg.sender] = true;
        signerCount = 1;
        upgradeNonce = 1;
    }

    /*********************************************
                    REGISTRY GETTERS
     *********************************************/
    function getCurrentTimelockDuration() public view returns (uint256) {
        return timelockDuration;
    }

    function getUpgradeNonce() public view returns (uint256) {
        return upgradeNonce;
    }

    function verifySigners(address[] memory signersToVerify)
        public
        view
        returns (uint256)
    {
        uint256 counter = 0;
        for (uint256 i = 0; i < signersToVerify.length; i++) {
            if (signers[signersToVerify[i]] == true) {
                counter++;
            }
        }
        return counter;
    }

    function f() public view returns (address) {
        return currentSettings[0];
    }

    /*********************************************
                    REGISTRY SETTERS
     *********************************************/
    function setFactory(
        uint256 nonce,
        address factory,
        MultisigEntry[] memory signatures
    ) public returns (bool) {
        require(upgradeNonce == nonce, "E01 - Invalid nonce.");
        satisfyQuorum(
            nonce,
            uint256(UpgradeTypes.SET_FACTORY),
            factory,
            0,
            false,
            signatures
        );
        upgradeTimelockSet[0] = block.number;
        queuedUpgrades[0] = factory;
        upgradeNonce++;
        return true;
    }

    function setTimelockDuration(
        uint256 nonce,
        uint256 newTimelockDuration,
        MultisigEntry[] memory signatures
    ) public returns (bool) {
        require(upgradeNonce == nonce, "E02 - Invalid nonce.");
        satisfyQuorum(
            nonce,
            uint256(UpgradeTypes.SWITCH_TIMELOCK),
            address(0),
            newTimelockDuration,
            false,
            signatures
        );
        timelockUpgradeStartSet = block.number;
        timelockDurationUpgrade = newTimelockDuration;
        upgradeNonce++;
        return true;
    }

    /*********************************************
                    REGISTRY CONTROL
     *********************************************/
    function executeUpgrades() public returns (bool) {
        if (
            block.number - timelockUpgradeStartSet >= timelockDuration &&
            timelockDurationUpgrade != 0
        ) {
            timelockUpgradeStartSet = block.number;
            timelockDuration = timelockDurationUpgrade;
            timelockDurationUpgrade = 0;
            emit upgradePerformed(
                "Timelock Upgraded",
                address(0),
                timelockDuration,
                false
            );
        } else {
            emit upgradeFailed(
                "Timelock Upgrade Failed",
                address(0),
                timelockDurationUpgrade,
                false,
                timelockUpgradeStartSet + timelockDuration
            );
        }
        for (uint256 i = 0; i < 3; i++) {
            if (
                block.number - upgradeTimelockSet[i] >= timelockDuration &&
                queuedUpgrades[i] != address(0)
            ) {
                upgradeTimelockSet[i] = block.number;
                currentSettings[i] = queuedUpgrades[i];
                queuedUpgrades[i] = address(0);
                if (i == 0) {
                    emit upgradePerformed(
                        "Factory Upgraded",
                        currentSettings[i],
                        0,
                        false
                    );
                }
            } else {
                if (i == 0) {
                    emit upgradeFailed(
                        "Factory Upgrade Failed",
                        currentSettings[i],
                        0,
                        false,
                        upgradeTimelockSet[i] + timelockDuration
                    );
                }
            }
        }
        return true;
    }

    function cancelUpgrade(
        uint256 nonce,
        uint256 upgradeType,
        MultisigEntry[] memory signatures
    ) public returns (bool) {
        require(upgradeNonce == nonce, "E03 - Invalid nonce.");
        satisfyQuorum(
            nonce,
            uint256(UpgradeTypes.CANCEL_QUEUED_UPGRADE),
            address(0),
            0,
            false,
            signatures
        );
        if (upgradeType == uint256(UpgradeTypes.SWITCH_TIMELOCK)) {
            emit upgradeCanceled(
                "Timelock Upgrade Canceled",
                address(0),
                timelockDurationUpgrade,
                false,
                timelockUpgradeStartSet + timelockDuration
            );
            timelockUpgradeStartSet = block.number;
            timelockDurationUpgrade = 0;
        } else if (upgradeType == uint256(UpgradeTypes.SET_FACTORY)) {
            emit upgradeCanceled(
                "Factory Upgrade Canceled",
                queuedUpgrades[0],
                0,
                false,
                upgradeTimelockSet[0] + timelockDuration
            );
            upgradeTimelockSet[0] = block.number;
            queuedUpgrades[0] = address(0);
        }

        upgradeNonce++;
        return true;
    }

    /*********************************************
                    SIGNER UTILITIES
     *********************************************/
    function setSigner(
        uint256 nonce,
        address signer,
        bool enable,
        MultisigEntry[] memory signatures
    ) public returns (bool) {
        require(upgradeNonce == nonce, "E04 - Invalid nonce.");
        satisfyQuorum(
            nonce,
            uint256(UpgradeTypes.SWITCH_SIGNER),
            signer,
            0,
            enable,
            signatures
        );
        if (signers[signer] != false && enable == false) {
            signerCount--;
        }
        if (signers[signer] != true && enable == true) {
            signerCount++;
        }
        signers[signer] = enable;
        upgradeNonce++;
        emit upgradePerformed(
            (enable == true ? "Signer Enabled" : "Signer Disabled"),
            signer,
            0,
            signers[signer]
        );
        return true;
    }

    function satisfyQuorum(
        uint256 nonce,
        uint256 upgradeType,
        address addressTypeInput,
        uint256 intTypeInput,
        bool boolTypeInput,
        MultisigEntry[] memory signatures
    ) public view returns (bool) {
        require(signatures.length > 0, "E05 - No signatures.");
        address[] memory signatories = new address[](signatures.length);
        for (uint8 i = 0; i < signatures.length; i++) {
            signatories[i] = resolveSigner(
                nonce,
                upgradeType,
                addressTypeInput,
                intTypeInput,
                boolTypeInput,
                signatures[i]
            );
        }
        uint8 validSignersCount = 0;
        for (uint8 i = 0; i < signatories.length; i++) {
            if (signers[signatories[i]] == true) {
                validSignersCount++;
            }
        }
        require(
            validSignersCount >= requiredQuorum(),
            "E06 - Qourum not reached."
        );
        return true;
    }

    function requiredQuorum() public view returns (uint256) {
        if (signerCount == 2) {
            return 2;
        }
        uint256 halfOfSigners = (signerCount * 100) / 2;
        if (halfOfSigners % 20 == 10) {
            return signerCount / 2;
        } else {
            return (halfOfSigners + 50) / 100;
        }
    }

    function getSignerCount() public view returns (uint256) {
        return signerCount;
    }

    function resolveSigner(
        uint256 nonce,
        uint256 upgradeType,
        address addressTypeInput,
        uint256 intTypeInput,
        bool boolTypeInput,
        MultisigEntry memory signature
    ) public view returns (address) {
        return
            recover(
                keccak256(
                    abi.encodePacked(
                        nonce,
                        address(this),
                        upgradeType,
                        addressTypeInput,
                        intTypeInput,
                        boolTypeInput
                    )
                ),
                signature.v,
                signature.r,
                signature.s
            );
    }

    function recover(
        bytes32 messageHash,
        uint8 vv,
        bytes32 rr,
        bytes32 ss
    ) internal pure returns (address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedMessageHash = keccak256(
            abi.encodePacked(prefix, messageHash)
        );
        return ecrecover(prefixedMessageHash, vv, rr, ss);
    }
}
