import { task } from 'hardhat/config';
import { eContractid } from '../../helpers/types';
import {
  getEthersSigners,
  getPalmyRewardsVaultImpl,
  getPalmyRewardsVault,
  getTokenVesting,
  getPlmyToken,
} from '../../helpers/contracts-helpers';
import { waitForTx } from '../../helpers/misc-utils';
import {
  ZERO_ADDRESS,
  getPlmyTokenTreasuryAddressPerNetwork,
  getWOASTokenPerNetwork,
} from '../../helpers/constants';
import { eEthereumNetwork } from '../../helpers/types-common';
import { parseEther } from 'ethers/lib/utils';

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
    const palmyToken = await getPlmyToken();
    await waitForTx(await vesting.initialzie(palmyToken.address));

    console.log('Transfer Ownership of vesting to Vesting Owner');
    const [, vestingOwner] = await getEthersSigners();
    await waitForTx(await vesting.transferOwnership(await vestingOwner.getAddress()));
    console.log('Withdraw PLMY from vesting temporarily');
    await waitForTx(await vesting.connect(vestingOwner).withdraw(parseEther('10000000')));
    console.log('Transfer PLMY to Treasury');
    await waitForTx(
      await palmyToken
        .connect(vestingOwner)
        .transfer(await getPlmyTokenTreasuryAddressPerNetwork(network), parseEther('10000000'))
    );
    console.log('\tFinished Plmy Token and Transparent Proxy initialization');
  }
);
