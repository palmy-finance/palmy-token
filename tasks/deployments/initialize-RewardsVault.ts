import { task } from 'hardhat/config';
import { eContractid } from '../../helpers/types';
import {
  getEthersSigners,
  getPalmyRewardsVaultImpl,
  getPalmyRewardsVault,
} from '../../helpers/contracts-helpers';
import { waitForTx } from '../../helpers/misc-utils';
import {
  ZERO_ADDRESS,
  getIncentivesControllerPerNetwork,
  getWOASTokenPerNetwork,
} from '../../helpers/constants';
import { eEthereumNetwork } from '../../helpers/types-common';

const { PalmyRewardsVault } = eContractid;

task(
  `initialize-${PalmyRewardsVault}`,
  `Initialize the ${PalmyRewardsVault} proxy contract`
).setAction(async ({}, localBRE) => {
  await localBRE.run('set-dre');

  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }

  console.log(`\n- ${PalmyRewardsVault} initialization`);
  const incentivesController = await getIncentivesControllerPerNetwork(
    localBRE.network.name as eEthereumNetwork
  );
  const rewardsVaultImpl = await getPalmyRewardsVaultImpl();
  const rewardsVaultProxy = await getPalmyRewardsVault();
  const woas = await getWOASTokenPerNetwork(localBRE.network.name as eEthereumNetwork);
  if (!rewardsVaultImpl.address || rewardsVaultImpl.address == ZERO_ADDRESS) {
    throw new Error('Missing rewardsVaultImpl');
  }
  if (!rewardsVaultProxy.address || rewardsVaultImpl.address == ZERO_ADDRESS) {
    throw new Error('Missing rewardsVaultProxy');
  }
  if (!woas || rewardsVaultImpl.address == ZERO_ADDRESS) {
    throw new Error('Missing plmyToken');
  }
  console.log('\tInitializing Vault and Transparent Proxy');
  // If any other testnet, initialize for development purposes
  const rewardsVaultEncodedInitialize = rewardsVaultImpl.interface.encodeFunctionData(
    'initialize',
    [woas, incentivesController]
  );
  const [admin] = await getEthersSigners();
  await waitForTx(
    await rewardsVaultProxy['initialize(address,address,bytes)'](
      rewardsVaultImpl.address,
      await admin.getAddress(),
      rewardsVaultEncodedInitialize
    )
  );

  console.log('\tFinished Plmy Token and Transparent Proxy initialization');
});
