// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.11;

interface IPermissionedContractFactory {
  function getDeploymentAddress(
    bytes calldata bytecode,
    bytes32 salt
  ) external view returns (address addr);
}
