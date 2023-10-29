import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { eContractid } from '../../helpers/types';
import { eEthereumNetwork } from '../../helpers/types-common';
import { getPlmyAdminPerNetwork } from '../../helpers/constants';
import { checkVerification } from '../../helpers/etherscan-verification';
require('dotenv').config();

task('testnet-deployment', 'Deployment in shiden network')
  .addFlag(
    'verify',
    'Verify PlmyToken, TokenVesting and InitializableAdminUpgradeabilityProxy contract.'
  )
  .setAction(async ({ verify }, localBRE) => {
    const DRE: HardhatRuntimeEnvironment = await localBRE.run('set-dre');
    const network = DRE.network.name as eEthereumNetwork;
    const plmyAdmin = getPlmyAdminPerNetwork(network);

    if (!plmyAdmin) {
      throw Error(
        'The --admin parameter must be set for shiden network. Set an Ethereum address as --admin parameter input.'
      );
    }

    // If Etherscan verification is enabled, check needed enviroments to prevent loss of gas in failed deployments.
    if (verify) {
      checkVerification();
    }

    console.log('Plmy ADMIN', plmyAdmin);
    await DRE.run(`deploy-${eContractid.PlmyToken}`, { verify });
    await DRE.run(`deploy-${eContractid.TokenVesting}`, { verify });
    await DRE.run(`deploy-${eContractid.PalmyRewardsVault}`, {});
    await DRE.run(`initialize-${eContractid.PlmyToken}`, {
      admin: plmyAdmin,
      verify,
    });

    console.log('\n✔️  Finished the deployment of the Plmy Token Testnet Enviroment. ✔️');
  });
