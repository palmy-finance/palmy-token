import { MockIncentivesController } from './../types/MockIncentivesController.d';
import { MockIncentivesController__factory } from './../types/factories/MockIncentivesController__factory';
import { Erc20__factory } from './../types/factories/Erc20__factory';
import {
  getPlmyToken,
  getInitializableAdminUpgradeabilityProxy,
  deployRewardsVault,
  deployMintableErc20,
  insertContractAddressInDb,
} from './../helpers/contracts-helpers';
import { parseEther } from 'ethers/lib/utils';
import { TestEnv, makeSuite } from './helpers/make-suite';
import { getEthersSigners } from '../helpers/contracts-helpers';
import { ethers } from 'hardhat';
import { zeroAddress } from 'ethereumjs-util';
import { ZERO_ADDRESS } from '../helpers/constants';
import { eContractid } from '../helpers/types';

const { expect } = require('chai');

makeSuite('Palmy rewards vault', (testEnv: TestEnv) => {
  it('upgradeability', async () => {
    const { rewardsVault } = testEnv;
    const [newProxyAdmin, proxyAdmin] = await getEthersSigners();
    const proxyInstance = await (
      await getInitializableAdminUpgradeabilityProxy(rewardsVault.address)
    ).connect(proxyAdmin);
    proxyInstance.admin();
    await expect(proxyInstance.connect(newProxyAdmin).admin()).to.be.reverted;
    await proxyInstance.changeAdmin(await newProxyAdmin.getAddress());
    await proxyInstance.connect(newProxyAdmin).admin(); // not reverted
  });
  it('initialization', async () => {
    const { plmyToken } = testEnv;
    const vault = await deployRewardsVault(false);
    await expect(vault.initialize(ZERO_ADDRESS, plmyToken.address)).to.be.revertedWith(
      'RewardsVault: token address must not be empty'
    );
    await expect(vault.initialize(plmyToken.address, ZERO_ADDRESS)).to.be.revertedWith(
      'RewardsVault: incentive controller not be empty'
    );
  });
  it('safeTransfer-call from incentivesController is enabled', async () => {
    const { rewardsVault, mockIncentivesController } = testEnv;
    const [user1] = await getEthersSigners();
    const plmyToken = await getPlmyToken(await mockIncentivesController._token());
    const vaultAssetBefore = await plmyToken.balanceOf(rewardsVault.address);
    const transferAmount = parseEther('1');
    await mockIncentivesController.transferFromVault(await user1.getAddress(), transferAmount);
    const vaultAssetAfter = await plmyToken.balanceOf(rewardsVault.address);
    expect(vaultAssetAfter).to.be.eq(vaultAssetBefore.sub(transferAmount));
  });
  it('safeTransfer-call from not allowed instance is disabled', async () => {
    const { rewardsVault, mockIncentivesController } = testEnv;
    const [user1] = await getEthersSigners();
    const plmyToken = await getPlmyToken(await mockIncentivesController._token());
    const mockERC20 = await deployMintableErc20(['test', 'test', 18]);
    insertContractAddressInDb(eContractid.MintableErc20, mockERC20.address);
    await mockERC20.mint(parseEther('100000000'));
    await mockERC20.transfer(rewardsVault.address, parseEther('100000000'));

    const dummyIncentivesController = (await ethers.getContractFactory(
      'MockIncentivesController'
    )) as MockIncentivesController__factory;
    const notAllowedInstance = await dummyIncentivesController.deploy(
      rewardsVault.address,
      plmyToken.address
    );
    await expect(
      notAllowedInstance.transferFromVault(await user1.getAddress(), parseEther('1'))
    ).to.be.revertedWith('SafeERC20: low-level call failed');
  });
});
