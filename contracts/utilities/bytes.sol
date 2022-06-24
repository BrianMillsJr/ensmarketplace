pragma solidity ^0.7.5;

contract BytesUtilities {
  function toBytesFromUIntTruncated(uint256 self, uint8 byteLength)
    private
    pure
    returns (bytes memory bts)
  {
    require(byteLength <= 32, "E008");
    bts = new bytes(byteLength);
    uint256 data = self << ((32 - byteLength) * 8);
    assembly {
      mstore(add(bts, 32), data)
    }
  }

  function bytes32ToString(bytes32 _bytes32)
    public
    pure
    returns (string memory)
  {
    uint8 i = 0;
    while (i < 32 && _bytes32[i] != 0) {
      i++;
    }
    bytes memory bytesArray = new bytes(i);
    for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
      bytesArray[i] = _bytes32[i];
    }
    return string(bytesArray);
  }

  function bytesToBytes32(bytes memory _bytes, uint256 _start)
    internal
    pure
    returns (bytes32 r)
  {
    uint256 offset = _start + 0x20;
    require(_bytes.length >= offset, "E008");
    assembly {
      r := mload(add(_bytes, offset))
    }
  }

  function readBytes32(bytes memory _data, uint256 _offset)
    internal
    pure
    returns (uint256 new_offset, bytes32 r)
  {
    new_offset = _offset + 32;
    r = bytesToBytes32(_data, _offset);
  }

  function bytesEquals(bytes32 a, bytes32 b)
    internal
    pure
    returns (bool equal)
  {
    if (a.length != b.length) {
      return false;
    }
    uint256 addr;
    uint256 addr2;
    uint256 aLen = a.length;
    assembly {
      addr := add(a, 32)
      addr2 := add(b, 32)
    }
    assembly {
      equal := eq(keccak256(addr, aLen), keccak256(addr2, aLen))
    }
    return equal;
  }
}
