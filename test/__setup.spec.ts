import { InitializableAdminUpgradeabilityProxy__factory } from './../types/factories/InitializableAdminUpgradeabilityProxy__factory';
import { deployMockIncentivesController } from './../helpers/contracts-helpers';
import rawBRE from 'hardhat';

import {
  getEthersSigners,
  deployPlmyToken,
  deployInitializableAdminUpgradeabilityProxy,
  insertContractAddressInDb,
  deployMockTransferHook,
  deployMockVesting,
  deployRewardsVault,
} from '../helpers/contracts-helpers';

import path from 'path';
import fs from 'fs';

import { Signer } from 'ethers';

import { initializeMakeSuite } from './helpers/make-suite';
import { waitForTx, DRE } from '../helpers/misc-utils';
import { eContractid } from '../helpers/types';
import { parseEther } from 'ethers/lib/utils';
import { InitializableAdminUpgradeabilityProxy } from '../types/InitializableAdminUpgradeabilityProxy';

['misc', 'deployments', 'migrations'].forEach((folder) => {
  const tasksPath = path.join(__dirname, '../tasks', folder);
  fs.readdirSync(tasksPath).forEach((task) => require(`${tasksPath}/${task}`));
});

const buildTestEnv = async (deployer: Signer, secondaryWallet: Signer) => {
  console.time('setup');

  const plmyAdmin = await secondaryWallet.getAddress();

  const plmyTokenImpl = await deployPlmyToken();
  const plmyTokenProxy = await deployInitializableAdminUpgradeabilityProxy();
  const mockTokenVesting = await deployMockVesting(plmyTokenProxy.address);
  await insertContractAddressInDb(eContractid.MockTokenVesting, mockTokenVesting.address);

  const mockTransferHook = await deployMockTransferHook();
  const rewardsVaultImpl = await deployRewardsVault();
  await insertContractAddressInDb(eContractid.PalmyRewardsVaultImpl, rewardsVaultImpl.address);
  const rewardsVaultProxy = await new InitializableAdminUpgradeabilityProxy__factory(
    deployer
  ).deploy();
  await insertContractAddressInDb(eContractid.PalmyRewardsVault, rewardsVaultProxy.address);

  const plmyTokenEncodedInitialize = plmyTokenImpl.interface.encodeFunctionData('initialize', [
    mockTokenVesting.address,
    rewardsVaultProxy.address,
    mockTransferHook.address,
  ]);

  await waitForTx(
    await plmyTokenProxy['initialize(address,address,bytes)'](
      plmyTokenImpl.address,
      plmyAdmin,
      plmyTokenEncodedInitialize
    )
  );
  await insertContractAddressInDb(eContractid.PlmyToken, plmyTokenProxy.address);

  const mockIncentivesController = await deployMockIncentivesController(
    rewardsVaultProxy.address,
    plmyTokenProxy.address
  );
  await insertContractAddressInDb(
    eContractid.MockIncentivesController,
    mockIncentivesController.address
  );
  const rewardsVaultEncodedInitialize = rewardsVaultImpl.interface.encodeFunctionData(
    'initialize',
    [plmyTokenProxy.address, mockIncentivesController.address]
  );
  await waitForTx(
    await rewardsVaultProxy['initialize(address,address,bytes)'](
      rewardsVaultImpl.address,
      plmyAdmin,
      rewardsVaultEncodedInitialize
    )
  );
  await insertContractAddressInDb(eContractid.PalmyRewardsVault, rewardsVaultProxy.address);

  await insertContractAddressInDb(eContractid.MockTransferHook, mockTransferHook.address);

  await insertContractAddressInDb(eContractid.MockTokenVesting, mockTokenVesting.address);

  console.timeEnd('setup');
};

before(async () => {
  await rawBRE.run('set-dre');
  const [deployer, secondaryWallet] = await getEthersSigners();
  console.log('-> Deploying test environment...');
  await buildTestEnv(deployer, secondaryWallet);
  await initializeMakeSuite();
  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
});
