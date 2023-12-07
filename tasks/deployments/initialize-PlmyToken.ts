import { InitializableAdminUpgradeabilityProxy } from './../../types/InitializableAdminUpgradeabilityProxy.d';
import { task } from 'hardhat/config';
import { eContractid } from '../../helpers/types';
import {
  getPlmyToken,
  getPlmyTokenImpl,
  getContract,
  getTokenVesting,
  getPalmyRewardsVault,
} from '../../helpers/contracts-helpers';
import { waitForTx } from '../../helpers/misc-utils';
import {
  ZERO_ADDRESS,
  getPlmyAdminPerNetwork,
  getPlmyTokenTreasuryAddressPerNetwork,
} from '../../helpers/constants';
import { eEthereumNetwork } from '../../helpers/types-common';
import { parseEther } from 'ethers/lib/utils';

const { PlmyToken } = eContractid;

task(`initialize-${PlmyToken}`, `Initialize the ${PlmyToken} proxy contract`)
  .addOptionalParam(
    'admin',
    `The address to be added as an Admin role in ${PlmyToken} Transparent Proxy.`
  )
  .addFlag('onlyProxy', 'Initialize only the proxy contract, not the implementation contract')
  .setAction(async ({ admin, onlyProxy }, localBRE) => {
    await localBRE.run('set-dre');
    const network = localBRE.network.name as eEthereumNetwork;
    const plmyAdmin = admin || (await getPlmyAdminPerNetwork(network));

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(`\n- ${PlmyToken} initialization`);

    const plmyTokenImpl = await getPlmyTokenImpl();
    const plmyToken = await getPlmyToken();
    const tokenVesting = await getTokenVesting();
    const rewardsVaultProxy = await getPalmyRewardsVault();
    const plmyTokenProxy = await getContract<InitializableAdminUpgradeabilityProxy>(
      eContractid.InitializableAdminUpgradeabilityProxy,
      plmyToken.address
    );

    if (onlyProxy) {
      console.log(
        `\tWARNING: Not initializing the ${PlmyToken} implementation, only set PLMY_ADMIN to Transparent Proxy contract.`
      );
      await waitForTx(
        await plmyTokenProxy.functions['initialize(address,address,bytes)'](
          plmyTokenImpl.address,
          tokenVesting.address,
          '0x'
        )
      );
      console.log(
        `\tFinished ${PlmyToken} Proxy initialization, but not ${PlmyToken} implementation.`
      );
      return;
    }

    console.log('\tInitializing Plmy Token and Transparent Proxy');
    // If any other testnet, initialize for development purposes
    const plmyTokenEncodedInitialize = plmyTokenImpl.interface.encodeFunctionData('initialize', [
      tokenVesting.address,
      rewardsVaultProxy.address,
      ZERO_ADDRESS,
    ]);

    await waitForTx(
      await plmyTokenProxy['initialize(address,address,bytes)'](
        plmyTokenImpl.address,
        plmyAdmin,
        plmyTokenEncodedInitialize
      )
    );
    console.log('\tFinished Plmy Token and Transparent Proxy initialization');
  });
