import { task } from 'hardhat/config';
import { deployPlmyTokenV2, registerContractInJsonDb } from '../../helpers/contracts-helpers';
import { eContractid } from '../../helpers/types';

const { PlmyTokenV2, PlmyTokenImpl } = eContractid;

task(`deploy-${PlmyTokenV2}`, `Deploys the ${PlmyTokenV2} contract`)
  .addFlag('verify', 'Proceed with the Etherscan verification')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-dre');

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(`\n- ${PlmyTokenV2} deployment`);

    console.log(`\tDeploying ${PlmyTokenV2} implementation ...`);
    const plmyTokenImpl = await deployPlmyTokenV2(verify);
    await registerContractInJsonDb(PlmyTokenImpl, plmyTokenImpl);

    console.log(`\tFinished ${PlmyTokenV2} proxy and implementation deployment`);
  });
