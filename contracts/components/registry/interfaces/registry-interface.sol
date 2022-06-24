pragma solidity ^0.7.5;

interface RegistryInterface {
    function f() external returns (address);

    function setFactory(address factoryAddress) external returns (bool);

    function verifySigners(address[] memory signersToVerify)
        external
        view
        returns (uint256);

    function requiredQuorum() external view returns (uint256);
}
