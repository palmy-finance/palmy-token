import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { eEthereumNetwork } from '../../helpers/types-common';
import { eContractid } from '../../helpers/types';
import { checkVerification } from '../../helpers/etherscan-verification';
import { getPlmyAdminPerNetwork } from '../../helpers/constants';
require('dotenv').config();

task('astar-deployment', 'Deployment in astar network')
  .addFlag(
    'verify',
    'Verify PlmyToken, TokenVesting and InitializableAdminUpgradeabilityProxy contract.'
  )
  .setAction(async ({ verify }, localBRE) => {
    const DRE: HardhatRuntimeEnvironment = await localBRE.run('set-dre');
    const network = DRE.network.name as eEthereumNetwork;
    const PlmyAdmin = getPlmyAdminPerNetwork(network);

    if (!PlmyAdmin) {
      throw Error(
        'The --admin parameter must be set for astar network. Set an Ethereum address as --admin parameter input.'
      );
    }

    // If Etherscan verification is enabled, check needed enviroments to prevent loss of gas in failed deployments.
    if (verify) {
      checkVerification();
    }

    console.log('Plmy ADMIN', PlmyAdmin);
    await DRE.run(`deploy-${eContractid.PlmyToken}`, { verify });
    await DRE.run(`deploy-${eContractid.TokenVesting}`, {});
    await DRE.run(`deploy-${eContractid.PalmyRewardsVault}`, {});
    // The task will only initialize the proxy contract, not implementation
    await DRE.run(`initialize-${eContractid.PlmyToken}`, {
      admin: PlmyAdmin,
    });

    console.log('\n✔️ Finished the deployment of the Plmy Token Astar Enviroment. ✔️');
  });
