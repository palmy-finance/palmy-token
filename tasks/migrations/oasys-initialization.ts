import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { eEthereumNetwork } from '../../helpers/types-common';
import { eContractid } from '../../helpers/types';
import { checkVerification } from '../../helpers/etherscan-verification';
import { getPlmyAdminPerNetwork } from '../../helpers/constants';
require('dotenv').config();

task('initialization', 'Contract Initialization').setAction(async ({}, localBRE) => {
  const DRE: HardhatRuntimeEnvironment = await localBRE.run('set-dre');
  const network = DRE.network.name as eEthereumNetwork;

  console.log('\n✔️ Finished the deployment of the Plmy Token Shiden Enviroment. ✔️');
});
