import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { eEthereumNetwork } from '../../helpers/types-common';
import { eContractid } from '../../helpers/types';
require('dotenv').config();

task('token-initialization', 'Contract Initialization').setAction(async ({}, localBRE) => {
  const DRE: HardhatRuntimeEnvironment = await localBRE.run('set-dre');
  const network = DRE.network.name as eEthereumNetwork;
  await DRE.run(`initialize-${eContractid.PlmyToken}`);
  console.log('\n✔️ Finished the initialization of the Plmy Token Mainnet Environment. ✔️');
  console.log('\n Upgrading PlmyToken to V2 ✔️');
  await DRE.run(`upgrade-${eContractid.PlmyToken}`);
  console.log('\n✔️ Finished the upgrade of the Plmy Token Mainnet Environment. ✔️');
  console.log('\n✔️ Finished the deployment of the Plmy Token Shiden Enviroment. ✔️');
});
