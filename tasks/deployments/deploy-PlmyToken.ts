import { task } from 'hardhat/config';
import {
  deployPlmyToken,
  deployInitializableAdminUpgradeabilityProxy,
  registerContractInJsonDb,
} from '../../helpers/contracts-helpers';
import { eContractid } from '../../helpers/types';

const { PlmyToken, PlmyTokenImpl } = eContractid;

task(`deploy-${PlmyToken}`, `Deploys the ${PlmyToken} contract`)
  .addFlag('verify', 'Proceed with the Etherscan verification')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-dre');

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(`\n- ${PlmyToken} deployment`);

    console.log(`\tDeploying ${PlmyToken} implementation ...`);
    const plmyTokenImpl = await deployPlmyToken(verify);
    await registerContractInJsonDb(PlmyTokenImpl, plmyTokenImpl);

    console.log(`\tDeploying ${PlmyToken} Transparent Proxy ...`);
    const plmyTokenProxy = await deployInitializableAdminUpgradeabilityProxy(verify);
    await registerContractInJsonDb(PlmyToken, plmyTokenProxy);

    console.log(`\tFinished ${PlmyToken} proxy and implementation deployment`);
  });
