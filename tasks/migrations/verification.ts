import { task } from 'hardhat/config';

import { eContractid } from '../../helpers/types';
import {
  getDeployArgs,
  getPalmyRewardsVault,
  getPalmyRewardsVaultImpl,
  getPlmyToken,
  getPlmyTokenImpl,
  getTokenVesting,
} from '../../helpers/contracts-helpers';
import { verifyContract } from '../../helpers/etherscan-verification';
import { eEthereumNetwork } from '../../helpers/types-common';
require('dotenv').config();

task('verification', 'Verify contracts').setAction(async ({}, localBRE) => {
  await localBRE.run('set-dre');
  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }
  const network = localBRE.network.name as eEthereumNetwork;

  await verifyContract(eContractid.PlmyToken, (await getPlmyToken()).address, []);
  await verifyContract(eContractid.PlmyToken, (await getPlmyTokenImpl()).address, []);
  await verifyContract(eContractid.PlmyTokenV2, (await getPlmyToken()).address, []);
  await verifyContract(eContractid.PalmyRewardsVault, (await getPalmyRewardsVault()).address, []);
  await verifyContract(
    eContractid.PalmyRewardsVault,
    (
      await getPalmyRewardsVaultImpl()
    ).address,
    []
  );
  await verifyContract(
    eContractid.TokenVesting,
    (
      await getTokenVesting()
    ).address,
    getDeployArgs(network, eContractid.TokenVesting)
  );
  console.log('\n✔️ Finished verification. ✔️');
});
