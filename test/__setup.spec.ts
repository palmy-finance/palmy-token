import { InitializableAdminUpgradeabilityProxy__factory } from './../types/factories/InitializableAdminUpgradeabilityProxy__factory';
import {
  deployMintableErc20,
  deployMockIncentivesController,
} from './../helpers/contracts-helpers';
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
import { waitForTx } from '../helpers/misc-utils';
import { eContractid } from '../helpers/types';
import { ZERO_ADDRESS } from '../helpers/constants';
import { parseEther } from 'ethers/lib/utils';

['misc', 'deployments', 'migrations'].forEach((folder) => {
  const tasksPath = path.join(__dirname, '../tasks', folder);
  fs.readdirSync(tasksPath).forEach((task) => require(`${tasksPath}/${task}`));
});

const buildTestEnv = async (deployer: Signer, secondaryWallet: Signer) => {
  console.time('setup');

  const plmyAdmin = await secondaryWallet.getAddress();

  const plmyTokenImpl = await deployPlmyToken();
  const plmyTokenProxy = await deployInitializableAdminUpgradeabilityProxy();
  const mockTokenVesting = await deployMockVesting(
    plmyTokenProxy.address,
    await deployer.getAddress()
  );
  await insertContractAddressInDb(eContractid.MockTokenVesting, mockTokenVesting.address);

  const mockTransferHook = await deployMockTransferHook();
  const rewardsVaultImpl = await deployRewardsVault();
  await insertContractAddressInDb(eContractid.PalmyRewardsVaultImpl, rewardsVaultImpl.address);
  const rewardsVaultProxy = await new InitializableAdminUpgradeabilityProxy__factory(
    deployer
  ).deploy();
  await insertContractAddressInDb(eContractid.PalmyRewardsVaultProxy, rewardsVaultProxy.address);

  const plmyTokenEncodedInitialize = plmyTokenImpl.interface.encodeFunctionData('initialize', [
    mockTokenVesting.address,
    ZERO_ADDRESS,
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
  const woas = await deployMintableErc20(['Wrapped OAS', 'WOAS', 18]);
  await woas.mint(parseEther('1000000000000000000000000000'));
  await woas.transfer(rewardsVaultProxy.address, parseEther('1000000000000000000000000000'));

  const mockIncentivesController = await deployMockIncentivesController(
    rewardsVaultProxy.address,
    woas.address
  );
  await insertContractAddressInDb(
    eContractid.MockIncentivesController,
    mockIncentivesController.address
  );
  const rewardsVaultEncodedInitialize = rewardsVaultImpl.interface.encodeFunctionData(
    'initialize',
    [woas.address, mockIncentivesController.address]
  );
  await waitForTx(
    await rewardsVaultProxy['initialize(address,address,bytes)'](
      rewardsVaultImpl.address,
      plmyAdmin,
      rewardsVaultEncodedInitialize
    )
  );

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
