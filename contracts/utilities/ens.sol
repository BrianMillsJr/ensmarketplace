pragma solidity ^0.7.5;
pragma experimental ABIEncoderV2;

interface ENS {
    function recordExists(bytes32 node) external view returns (bool);

    function owner(bytes32 node) external view returns (address);
}
