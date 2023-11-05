import { task } from 'hardhat/config';
import {
  saveDeploymentCallData,
  exportPlmyTokenV2DeploymentCallData,
} from '../../helpers/contracts-helpers';
import { eContractid } from '../../helpers/types';

const { PlmyTokenV2 } = eContractid;

task(
  `export-deploy-calldata-${PlmyTokenV2}`,
  `Export deployment calldata of the ${PlmyTokenV2} contract`
).setAction(async ({}, localBRE) => {
  await localBRE.run('set-dre');

  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }

  console.log(`\n- ${PlmyTokenV2} exporting...`);

  console.log(`\Exporting ${PlmyTokenV2} calldata ...`);
  const plmyTokenV2Impl = await exportPlmyTokenV2DeploymentCallData();
  await saveDeploymentCallData(PlmyTokenV2, plmyTokenV2Impl);
  console.log(`\tFinished ${PlmyTokenV2} implementation exporting`);
});
