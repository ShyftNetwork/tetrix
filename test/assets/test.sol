pragma solidity ^0.4.21;

contract myContract {
  struct Player {
    string name; 
    bytes1 gender;
    uint8 age;
  }

  address tester;
  bool test;  
  bytes32 teststr;
  uint8 a;
  uint256 b;
  mapping(address => Player) players;
  uint8 c;
  bytes32[] d;
  bytes1 oneByte;
  bytes8 eightByte;
  int128 hey;

  constructor() public {
    test = true;
    a = 1;
    b = 2;
    c = 3;
    d.push("hello");
    teststr = "hi";
    oneByte = "1";
    eightByte = "hey";
    hey = 123;
    Player storage sender = players[msg.sender];
    sender.age = 10;
    sender.gender = "M";
    sender.name = "joseph";
  }
  
  function updateContract() {
    a = 2;
  }

}

