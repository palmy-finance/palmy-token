import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { eEthereumNetwork } from '../../helpers/types-common';
import { eContractid } from '../../helpers/types';
import { checkVerification } from '../../helpers/etherscan-verification';
import { getPlmyAdminPerNetwork } from '../../helpers/constants';
import { deployToOasysTestnet } from '../../helpers/contracts-helpers';
require('dotenv').config();

task('oasys-deployment', 'Deployment in oasys network').setAction(async ({}, localBRE) => {
  const DRE: HardhatRuntimeEnvironment = await localBRE.run('set-dre');
  const network = localBRE.network.name as eEthereumNetwork;
  await DRE.run(`export-deploy-calldata-${eContractid.PlmyToken}`);
  await DRE.run(`export-deploy-calldata-${eContractid.PlmyTokenV2}`);
  await DRE.run(`export-deploy-calldata-${eContractid.PalmyRewardsVault}`);
  await DRE.run(`export-deploy-calldata-${eContractid.TokenVesting}`);
  if (network === eEthereumNetwork.oasys) {
    console.log('\n✔️ Finished exporting Plmy Token Deployment calldata Oasys Enviroment. ✔️');
    return;
  }
  await deployToOasysTestnet(eContractid.PlmyToken);
  await deployToOasysTestnet(eContractid.PlmyTokenV2);
  await deployToOasysTestnet(eContractid.PalmyRewardsVault);
  await deployToOasysTestnet(eContractid.TokenVesting);
  console.log('\n✔️ Finished deploying Oasys Testnet Enviroment. ✔️');
});
