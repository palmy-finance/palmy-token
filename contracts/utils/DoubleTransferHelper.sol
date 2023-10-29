// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.11;

import "../interfaces/IERC20.sol";

contract DoubleTransferHelper {

    IERC20 public immutable PLMY;

    constructor(IERC20 plmy) public {
        PLMY = plmy;
    }

    function doubleSend(address to, uint256 amount1, uint256 amount2) external {
        PLMY.transfer(to, amount1);
        PLMY.transfer(to, amount2);
    }
}