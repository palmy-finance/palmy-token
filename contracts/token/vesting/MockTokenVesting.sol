// contracts/TokenVesting.sol
// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.11;

import './TokenVesting.sol';

/**
 * @title MockTokenVesting
 * WARNING: use only for testing and debugging purpose
 */
contract MockTokenVesting is TokenVesting {
  uint256 mockTime = 0;
  IERC20 private immutable _token;

  constructor(address token_, address owner) TokenVesting(owner) {
    _token = IERC20(token_);
  }

  function setCurrentTime(uint256 _time) external {
    mockTime = _time;
  }

  function getCurrentTime() internal view virtual override returns (uint256) {
    return mockTime;
  }

  function _currentTime() public view returns (uint256) {
    return getCurrentTime();
  }

  function releaseMock(address beneficiaryPayable, uint256 amount) public {
    _token.transfer(beneficiaryPayable, amount);
  }
}
