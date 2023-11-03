
// contracts/TokenVesting.sol
// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.11;
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract PalmyOwnable is Ownable {
    constructor(address owner) {
        _transferOwnership(owner);
    }
}
