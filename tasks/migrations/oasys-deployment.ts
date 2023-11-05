import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { eEthereumNetwork } from '../../helpers/types-common';
import { eContractid } from '../../helpers/types';
import { checkVerification } from '../../helpers/etherscan-verification';
import { getPlmyAdminPerNetwork } from '../../helpers/constants';
require('dotenv').config();

task('oasys-deployment', 'Deployment in oasys network and its testnet').setAction(
  async ({}, localBRE) => {
    const DRE: HardhatRuntimeEnvironment = await localBRE.run('set-dre');
    await DRE.run(`export-deploy-calldata-${eContractid.PlmyTokenV2}`);
    await DRE.run(`export-deploy-calldata-${eContractid.PalmyRewardsVault}`);
    await DRE.run(`export-deploy-calldata-${eContractid.TokenVesting}`);

    console.log('\n✔️ Finished exporting Plmy Token Deployment calldata Oasys Enviroment. ✔️');
  }
);
