pragma solidity ^0.7.5;

contract StructMultiSigEntry {
  struct MultisigEntry {
    uint8 v;
    bytes32 r;
    bytes32 s;
  }
}