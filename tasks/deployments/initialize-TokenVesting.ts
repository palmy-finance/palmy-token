import { task } from 'hardhat/config';
import { eContractid } from '../../helpers/types';
import {
  getEthersSigners,
  getPalmyRewardsVaultImpl,
  getPalmyRewardsVault,
  getTokenVesting,
} from '../../helpers/contracts-helpers';
import { waitForTx } from '../../helpers/misc-utils';
import {
  ZERO_ADDRESS,
  getPalmyTokenPerNetwork,
  getWOASTokenPerNetwork,
} from '../../helpers/constants';
import { eEthereumNetwork } from '../../helpers/types-common';

const { TokenVesting } = eContractid;

task(`initialize-${TokenVesting}`, `Initialize the ${TokenVesting} proxy contract`).setAction(
  async ({}, localBRE) => {
    await localBRE.run('set-dre');

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }
    const network = localBRE.network.name as eEthereumNetwork;

    console.log(`\n- ${TokenVesting} initialization`);
    const vesting = await getTokenVesting();
    const palmyToken = await getPalmyTokenPerNetwork(network);
    await vesting.initialzie(palmyToken);

    console.log('\tFinished Plmy Token and Transparent Proxy initialization');
  }
);
