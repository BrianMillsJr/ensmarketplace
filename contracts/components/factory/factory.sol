pragma solidity ^0.7.5;
pragma experimental ABIEncoderV2;

import "../../utilities/ens.sol";
import "../../utilities/erc721.sol";
import "../../utilities/structs.sol";
import "../../utilities/bytes.sol";
import "../../utilities/factory-constants.sol";
import "../registry/interfaces/registry-interface.sol";

contract Factory is Structs {
    bool rentryGuardActive;
    mapping(uint256 => address) public addressStorage;
    mapping(uint256 => uint256) public uintStorage;
    mapping(address => mapping(bytes32 => uint256)) public receiptNonces;

    event Sold(
        string domain,
        address buyer,
        address seller,
        uint256 price,
        uint256 commision,
        uint256 refunded
    );
    event Updated(string domain);
    event CommisionChanged(uint256 previousRate, uint256 newRate);

    modifier onlyUpgradeMultisig(LocalUpgrade[] memory upgradeSignatures) {
        RegistryInterface registry = RegistryInterface(
            addressStorage[FactoryConstants.STORAGE_SLOT_REGISTRY_ADDRESS]
        );
        address[] memory signersToVerify = new address[](
            upgradeSignatures.length
        );
        for (uint256 i = 0; i < upgradeSignatures.length; i++) {
            signersToVerify[i] = resolveUpgradeSigner(
                uintStorage[FactoryConstants.STORAGE_SLOT_UPGRADE_NONCE_UINT],
                upgradeSignatures[i].signature
            );
        }
        uint256 validSignerCount = registry.verifySigners(signersToVerify);
        uint256 requiredQuorum = registry.requiredQuorum();
        require(
            validSignerCount >= requiredQuorum,
            "E01 - Multisig quorum failed."
        );
        _;
    }

    modifier noReentry() {
        require(rentryGuardActive == false, "E02 - Re-entry forbidden.");
        rentryGuardActive = true;
        _;
    }

    function buyDomain(SaleReceipt memory saleReceipt)
        public
        payable
        noReentry
    {
        address receiptSigner = resolveSellerReceiptSigner(saleReceipt);
        bytes32 domainName = getNameHash(saleReceipt.domain);
        require(
            receiptSigner == saleReceipt.seller,
            "E03 - sale receipt invalid."
        );
        require(nameExists(domainName) == true, "E04 - domain does not exist.");
        require(
            nameOwner(domainName) == receiptSigner,
            "E05 - receipt signer is not owner of the domain."
        );
        require(
            getReceiptNonce(saleReceipt.seller, saleReceipt.domain) ==
                saleReceipt.receiptNonce,
            "E05 - receipt has expired."
        );
        require(block.number < saleReceipt.expiry, "E06 - receipt expired");
        ERC721 ensToken = ERC721(
            addressStorage[FactoryConstants.STORAGE_SLOT_ENS_TOKEN_ADDRESS]
        );
        uint256 tokenId = uint256(keccak256(bytes(saleReceipt.domain)));
        address payable buyer = address(uint160(msg.sender));
        address payable seller = address(uint160(receiptSigner));
        address payable treasury = address(
            uint160(addressStorage[FactoryConstants.STORAGE_SLOT_OWNER_ADDRESS])
        );
        uint256 commissionRate = uintStorage[
            FactoryConstants.STORAGE_SLOT_COMMISSION_RATE_UINT
        ];
        uint256 offerPrice = msg.value;
        uint256 salePrice = saleReceipt.price;
        uint256 commisionTotal = (salePrice / 10000) * commissionRate;
        uint256 refundTotal = offerPrice - salePrice;
        treasury.transfer(commisionTotal);
        seller.transfer(salePrice - commisionTotal);
        if (offerPrice > salePrice) {
            buyer.transfer(refundTotal);
        }
        ensToken.safeTransferFrom(seller, buyer, tokenId);
        incrementReceiptNonce(seller, saleReceipt.domain);
        emit Sold(
            saleReceipt.domain,
            msg.sender,
            receiptSigner,
            salePrice,
            commisionTotal,
            refundTotal
        );
        completeAction();
    }

    function incrementReceiptNonce(address seller, string memory domainNameStr)
        public
    {
        bytes32 domainName = getNameHash(domainNameStr);
        if (receiptNonces[seller][domainName] == 0) {
            receiptNonces[seller][domainName] = 2;
        } else {
            receiptNonces[seller][domainName]++;
        }
    }

    function getReceiptNonce(address seller, string memory domainNameStr)
        public
        view
        returns (uint256)
    {
        bytes32 domainName = getNameHash(domainNameStr);
        if (receiptNonces[seller][domainName] == 0) {
            return 1;
        }
        return receiptNonces[seller][domainName];
    }

    function voidReceipt(string memory domainNameStr) public noReentry {
        bytes32 domainName = getNameHash(domainNameStr);
        if (receiptNonces[msg.sender][domainName] == 0) {
            receiptNonces[msg.sender][domainName] = 2;
        } else {
            receiptNonces[msg.sender][domainName]++;
        }
        emit Updated(domainNameStr);
        completeAction();
    }

    function changeCommissionRate(
        uint256 newCommissionRate,
        LocalUpgrade[] memory upgradeSignatures
    ) public onlyUpgradeMultisig(upgradeSignatures) {
        uint256 commissionRate = uintStorage[
            FactoryConstants.STORAGE_SLOT_COMMISSION_RATE_UINT
        ];
        emit CommisionChanged(commissionRate, newCommissionRate);
        uintStorage[
            FactoryConstants.STORAGE_SLOT_COMMISSION_RATE_UINT
        ] = newCommissionRate;
        upgradeNonceIncrement();
    }

    function completeAction() private {
        rentryGuardActive = false;
    }

    function nameExists(bytes32 node) public view returns (bool) {
        ENS ens = ENS(
            addressStorage[FactoryConstants.STORAGE_SLOT_ENS_REGISTRY_ADDRESS]
        );
        return ens.recordExists(node);
    }

    function nameOwner(bytes32 node) public view returns (address) {
        ENS ens = ENS(
            addressStorage[FactoryConstants.STORAGE_SLOT_ENS_REGISTRY_ADDRESS]
        );
        return ens.owner(node);
    }

    function getNameHash(string memory domainName)
        public
        pure
        returns (bytes32)
    {
        bytes32 namehash = 0x0000000000000000000000000000000000000000000000000000000000000000;
        namehash = keccak256(
            abi.encodePacked(namehash, keccak256(abi.encodePacked("eth")))
        );
        namehash = keccak256(
            abi.encodePacked(namehash, keccak256(abi.encodePacked(domainName)))
        );
        return namehash;
    }

    function getUpgradeNonce() public view returns (uint256) {
        if (FactoryConstants.STORAGE_SLOT_UPGRADE_NONCE_UINT == 0) {
            return 1;
        }
        return uintStorage[FactoryConstants.STORAGE_SLOT_UPGRADE_NONCE_UINT];
    }

    function upgradeNonceIncrement() private {
        uintStorage[FactoryConstants.STORAGE_SLOT_UPGRADE_NONCE_UINT]++;
    }

    function resolveUpgradeSigner(uint256 nonce, MultisigEntry memory signature)
        public
        view
        returns (address)
    {
        return
            recover(
                keccak256(abi.encodePacked(address(this), nonce)),
                signature.v,
                signature.r,
                signature.s
            );
    }

    function resolveSellerReceiptSigner(SaleReceipt memory saleReceipt)
        public
        view
        returns (address)
    {
        uint256 commissionRate = uintStorage[
            FactoryConstants.STORAGE_SLOT_COMMISSION_RATE_UINT
        ];
        return
            recover(
                keccak256(
                    abi.encodePacked(
                        address(this),
                        saleReceipt.seller,
                        saleReceipt.receiptNonce,
                        saleReceipt.domain,
                        saleReceipt.price,
                        saleReceipt.expiry,
                        commissionRate
                    )
                ),
                saleReceipt.v,
                saleReceipt.r,
                saleReceipt.s
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
