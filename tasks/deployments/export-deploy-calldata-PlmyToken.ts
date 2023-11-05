import { task } from 'hardhat/config';
import {
  exportPlmyTokenDeploymentCallData,
  saveDeploymentCallData,
  exportInitializableAdminUpgradeabilityProxyCallData,
} from '../../helpers/contracts-helpers';
import { eContractid } from '../../helpers/types';

const { PlmyToken, PlmyTokenImpl } = eContractid;

task(
  `export-deploy-calldata-${PlmyToken}`,
  `Export deployment calldata of the ${PlmyToken} contract`
).setAction(async ({}, localBRE) => {
  await localBRE.run('set-dre');

  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }

  console.log(`\n- ${PlmyToken} exporting...`);

  console.log(`\Exporting ${PlmyToken} calldata ...`);
  const plmyTokenImpl = await exportPlmyTokenDeploymentCallData();
  await saveDeploymentCallData(PlmyTokenImpl, plmyTokenImpl);

  console.log(`\tDeploying ${PlmyToken} Transparent Proxy ...`);
  const plmyTokenProxy = await exportInitializableAdminUpgradeabilityProxyCallData();
  await saveDeploymentCallData(PlmyToken, plmyTokenProxy);

  console.log(`\tFinished ${PlmyToken} proxy and implementation exporting`);
});
