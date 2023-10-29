import { task } from 'hardhat/config';
import { eContractid } from '../../helpers/types';
import {
  deployVesting,
  getContract,
  getPlmyToken,
  registerContractInJsonDb,
} from '../../helpers/contracts-helpers';
import { InitializableAdminUpgradeabilityProxy } from '../../types/InitializableAdminUpgradeabilityProxy';
import { ZERO_ADDRESS } from '../../helpers/constants';

const { TokenVesting } = eContractid;

task(`deploy-${TokenVesting}`, `Deploy the ${TokenVesting} contract`)
  .addFlag('verify', 'Proceed with the Etherscan verification')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-dre');

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(`\n- ${TokenVesting} deployment`);
    const plmyToken = await getPlmyToken();
    const plmyTokenProxy = await getContract<InitializableAdminUpgradeabilityProxy>(
      eContractid.InitializableAdminUpgradeabilityProxy,
      plmyToken.address
    );
    if (!plmyTokenProxy.address) {
      throw new Error('missing plmyTokenProxy address');
    }

    const tokenVesting = await deployVesting(plmyTokenProxy.address, verify);
    await registerContractInJsonDb(TokenVesting, tokenVesting);

    console.log('\tFinished TokenVesting Implementation deployment.');
  });
