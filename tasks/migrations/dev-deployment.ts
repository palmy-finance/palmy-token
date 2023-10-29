import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { eContractid } from '../../helpers/types';
import { getEthersSigners } from '../../helpers/contracts-helpers';
import { checkVerification } from '../../helpers/etherscan-verification';
require('dotenv').config();

task('dev-deployment', 'Deployment in hardhat')
  .addFlag('verify', 'Verify PlmyToken and InitializableAdminUpgradeabilityProxy contract.')
  .setAction(async ({ admin, verify }, localBRE) => {
    const DRE: HardhatRuntimeEnvironment = await localBRE.run('set-dre');

    // If admin parameter is NOT set, the Plmy Admin will be the
    // second account provided via buidler config.
    const [, secondaryWallet] = await getEthersSigners();
    const plmyAdmin = admin || (await secondaryWallet.getAddress());

    console.log('Plmy ADMIN', plmyAdmin);

    // If Etherscan verification is enabled, check needed enviroments to prevent loss of gas in failed deployments.
    if (verify) {
      checkVerification();
    }

    await DRE.run(`deploy-${eContractid.PlmyToken}`, { verify });

    await DRE.run(`initialize-${eContractid.PlmyToken}`, {
      admin: plmyAdmin,
    });

    await DRE.run(`deploy-${eContractid.TokenVesting}`, {
      admin: plmyAdmin,
    });

    console.log('\n👷 Finished the deployment of the Plmy Token Development Enviroment. 👷');
  });
