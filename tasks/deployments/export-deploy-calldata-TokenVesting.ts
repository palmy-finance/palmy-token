import { task } from 'hardhat/config';
import {
  saveDeploymentCallData,
  exportPlmyTokenV2DeploymentCallData,
  exportRewardsVaultCallData,
  exportInitializableAdminUpgradeabilityProxyCallData,
  exportVestingDeploymentCallData,
} from '../../helpers/contracts-helpers';
import { eContractid } from '../../helpers/types';
import { getVestingOwnerPerNetwork } from '../../helpers/constants';
import { eEthereumNetwork } from '../../helpers/types-common';

const { TokenVesting } = eContractid;

task(
  `export-deploy-calldata-${TokenVesting}`,
  `Export deployment calldata of the ${TokenVesting} contract`
).setAction(async ({}, localBRE) => {
  await localBRE.run('set-dre');
  const network = localBRE.network.name as eEthereumNetwork;

  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }

  console.log(`\n- ${TokenVesting} exporting...`);

  console.log(`\Exporting ${TokenVesting} calldata ...`);
  const tokenVesting = await exportVestingDeploymentCallData(network);
  await saveDeploymentCallData(TokenVesting, tokenVesting);
  console.log(`\tFinished ${TokenVesting} implementation exporting`);
});
