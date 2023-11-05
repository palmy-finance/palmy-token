import { task } from 'hardhat/config';
import {
  saveDeploymentCallData,
  exportPlmyTokenV2DeploymentCallData,
  exportRewardsVaultCallData,
  exportInitializableAdminUpgradeabilityProxyCallData,
} from '../../helpers/contracts-helpers';
import { eContractid } from '../../helpers/types';

const { PalmyRewardsVault, PalmyRewardsVaultImpl, PalmyRewardsVaultProxy } = eContractid;

task(
  `export-deploy-calldata-${PalmyRewardsVault}`,
  `Export deployment calldata of the ${PalmyRewardsVault} contract`
).setAction(async ({}, localBRE) => {
  await localBRE.run('set-dre');

  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }

  console.log(`\n- ${PalmyRewardsVaultImpl} exporting...`);

  console.log(`\Exporting ${PalmyRewardsVaultImpl} calldata ...`);
  const vault = await exportRewardsVaultCallData();
  await saveDeploymentCallData(PalmyRewardsVault, vault);
  console.log(`\tExport ${PalmyRewardsVault} Transparent Proxy ...`);
  const vaultProxy = await exportInitializableAdminUpgradeabilityProxyCallData();
  await saveDeploymentCallData(PalmyRewardsVaultProxy, vaultProxy);
  console.log(`\tFinished ${PalmyRewardsVault} proxy and implementation exporting`);
});
