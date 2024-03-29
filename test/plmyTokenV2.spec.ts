import { PlmyTokenV2 } from '../types/PlmyTokenV2';
import { fail } from 'assert';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { TestEnv, makeSuite } from './helpers/make-suite';
import { eContractid, ProtocolErrors } from '../helpers/types';
import { eEthereumNetwork } from '../helpers/types-common';
import { waitForTx, DRE } from '../helpers/misc-utils';
import {
  getInitializableAdminUpgradeabilityProxy,
  buildPermitParams,
  getSignatureFromTypedData,
  deployDoubleTransferHelper,
  deployPlmyTokenV2,
  getContract,
} from '../helpers/contracts-helpers';
import {
  ZERO_ADDRESS,
  MAX_UINT_AMOUNT,
  getPlmyTokenDomainSeparatorPerNetwork,
} from '../helpers/constants';
import { parseEther } from 'ethers/lib/utils';

const { expect } = require('chai');

makeSuite('PLMY token V2', (testEnv: TestEnv) => {
  let plmyTokenV2: PlmyTokenV2;

  it('Updates the implementation of the PLMY token to V2', async () => {
    const { plmyToken: plmyToken, users } = testEnv;

    //getting the proxy contract from the plmy token address
    const plmyTokenProxy = await getContract(
      eContractid.InitializableAdminUpgradeabilityProxy,
      plmyToken.address
    );

    const PLMYv2 = await deployPlmyTokenV2();

    const encodedIntialize = PLMYv2.interface.encodeFunctionData('initialize');

    await plmyTokenProxy
      .connect(users[0].signer)
      .upgradeToAndCall(PLMYv2.address, encodedIntialize);

    plmyTokenV2 = await getContract(eContractid.PlmyTokenV2, plmyTokenProxy.address);
  });

  it('Checks initial configuration', async () => {
    expect(await plmyTokenV2.name()).to.be.equal('Plmy Token', 'Invalid token name');

    expect(await plmyTokenV2.symbol()).to.be.equal('PLMY', 'Invalid token symbol');

    expect((await plmyTokenV2.decimals()).toString()).to.be.equal('18', 'Invalid token decimals');
  });

  it('Checks the domain separator', async () => {
    const network = DRE.network.name;
    const DOMAIN_SEPARATOR_ENCODED = getPlmyTokenDomainSeparatorPerNetwork(
      network as eEthereumNetwork
    );

    const separator = await plmyTokenV2.DOMAIN_SEPARATOR();
    expect(separator).to.be.equal(DOMAIN_SEPARATOR_ENCODED, 'Invalid domain separator');
  });

  it('Checks the revision', async () => {
    const revision = await plmyTokenV2.REVISION();

    expect(revision.toString()).to.be.equal('2', 'Invalid revision');
  });

  it('Checks the allocation of the initial PLMY supply', async () => {
    const expectedDistributionBalance = new BigNumber(10000000).times(new BigNumber(10).pow(18));
    const { mockVesting } = testEnv;
    const distributedBalance = await plmyTokenV2.balanceOf(mockVesting.address);

    expect(distributedBalance.toString()).to.be.equal(
      expectedDistributionBalance.toFixed(0),
      'Invalid distribution balance'
    );
  });

  it('Reverts submitting a permit with 0 expiration', async () => {
    const { deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const expiration = 0;
    const nonce = (await plmyTokenV2._nonces(owner)).toNumber();
    const permitAmount = ethers.utils.parseEther('2').toString();
    const msgParams = buildPermitParams(
      chainId,
      plmyTokenV2.address,
      owner,
      spender,
      nonce,
      permitAmount,
      expiration.toFixed()
    );

    const ownerPrivateKey = require('../test-wallets.js').accounts[0].secretKey;
    if (!ownerPrivateKey) {
      throw new Error('INVALID_OWNER_PK');
    }

    expect((await plmyTokenV2.allowance(owner, spender)).toString()).to.be.equal(
      '0',
      'INVALID_ALLOWANCE_BEFORE_PERMIT'
    );

    const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

    await expect(
      plmyTokenV2.connect(users[1].signer).permit(owner, spender, permitAmount, expiration, v, r, s)
    ).to.be.revertedWith('INVALID_EXPIRATION');

    expect((await plmyTokenV2.allowance(owner, spender)).toString()).to.be.equal(
      '0',
      'INVALID_ALLOWANCE_AFTER_PERMIT'
    );
  });

  it('Submits a permit with maximum expiration length', async () => {
    const { deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    const configChainId = DRE.network.config.chainId;
    expect(configChainId).to.be.equal(chainId);
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const deadline = MAX_UINT_AMOUNT;
    const nonce = (await plmyTokenV2._nonces(owner)).toNumber();
    const permitAmount = ethers.utils.parseEther('2').toString();
    const msgParams = buildPermitParams(
      chainId,
      plmyTokenV2.address,
      owner,
      spender,
      nonce,
      deadline,
      permitAmount
    );

    const ownerPrivateKey = require('../test-wallets.js').accounts[0].secretKey;
    if (!ownerPrivateKey) {
      throw new Error('INVALID_OWNER_PK');
    }

    expect((await plmyTokenV2.allowance(owner, spender)).toString()).to.be.equal(
      '0',
      'INVALID_ALLOWANCE_BEFORE_PERMIT'
    );

    const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

    await waitForTx(
      await plmyTokenV2
        .connect(users[1].signer)
        .permit(owner, spender, permitAmount, deadline, v, r, s)
    );

    expect((await plmyTokenV2._nonces(owner)).toNumber()).to.be.equal(1);
  });

  it('Cancels the previous permit', async () => {
    const { deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const deadline = MAX_UINT_AMOUNT;
    const nonce = (await plmyTokenV2._nonces(owner)).toNumber();
    const permitAmount = '0';
    const msgParams = buildPermitParams(
      chainId,
      plmyTokenV2.address,
      owner,
      spender,
      nonce,
      deadline,
      permitAmount
    );

    const ownerPrivateKey = require('../test-wallets.js').accounts[0].secretKey;
    if (!ownerPrivateKey) {
      throw new Error('INVALID_OWNER_PK');
    }

    const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

    expect((await plmyTokenV2.allowance(owner, spender)).toString()).to.be.equal(
      ethers.utils.parseEther('2'),
      'INVALID_ALLOWANCE_BEFORE_PERMIT'
    );

    await waitForTx(
      await plmyTokenV2
        .connect(users[1].signer)
        .permit(owner, spender, permitAmount, deadline, v, r, s)
    );
    expect((await plmyTokenV2.allowance(owner, spender)).toString()).to.be.equal(
      permitAmount,
      'INVALID_ALLOWANCE_AFTER_PERMIT'
    );

    expect((await plmyTokenV2._nonces(owner)).toNumber()).to.be.equal(2);
  });

  it('Tries to submit a permit with invalid nonce', async () => {
    const { deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const deadline = MAX_UINT_AMOUNT;
    const nonce = 1000;
    const permitAmount = '0';
    const msgParams = buildPermitParams(
      chainId,
      plmyTokenV2.address,
      owner,
      spender,
      nonce,
      deadline,
      permitAmount
    );

    const ownerPrivateKey = require('../test-wallets.js').accounts[0].secretKey;
    if (!ownerPrivateKey) {
      throw new Error('INVALID_OWNER_PK');
    }

    const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

    await expect(
      plmyTokenV2.connect(users[1].signer).permit(owner, spender, permitAmount, deadline, v, r, s)
    ).to.be.revertedWith('INVALID_SIGNATURE');
  });

  it('Tries to submit a permit with invalid expiration (previous to the current block)', async () => {
    const { deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const expiration = '1';
    const nonce = (await plmyTokenV2._nonces(owner)).toNumber();
    const permitAmount = '0';
    const msgParams = buildPermitParams(
      chainId,
      plmyTokenV2.address,
      owner,
      spender,
      nonce,
      expiration,
      permitAmount
    );

    const ownerPrivateKey = require('../test-wallets.js').accounts[0].secretKey;
    if (!ownerPrivateKey) {
      throw new Error('INVALID_OWNER_PK');
    }

    const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

    await expect(
      plmyTokenV2.connect(users[1].signer).permit(owner, spender, expiration, permitAmount, v, r, s)
    ).to.be.revertedWith('INVALID_EXPIRATION');
  });

  it('Tries to submit a permit with invalid signature', async () => {
    const { deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const deadline = MAX_UINT_AMOUNT;
    const nonce = (await plmyTokenV2._nonces(owner)).toNumber();
    const permitAmount = '0';
    const msgParams = buildPermitParams(
      chainId,
      plmyTokenV2.address,
      owner,
      spender,
      nonce,
      deadline,
      permitAmount
    );

    const ownerPrivateKey = require('../test-wallets.js').accounts[0].secretKey;
    if (!ownerPrivateKey) {
      throw new Error('INVALID_OWNER_PK');
    }

    const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

    await expect(
      plmyTokenV2
        .connect(users[1].signer)
        .permit(owner, ZERO_ADDRESS, permitAmount, deadline, v, r, s)
    ).to.be.revertedWith('INVALID_SIGNATURE');
  });

  it('Tries to submit a permit with invalid owner', async () => {
    const { deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const expiration = MAX_UINT_AMOUNT;
    const nonce = (await plmyTokenV2._nonces(owner)).toNumber();
    const permitAmount = '0';
    const msgParams = buildPermitParams(
      chainId,
      plmyTokenV2.address,
      owner,
      spender,
      nonce,
      expiration,
      permitAmount
    );

    const ownerPrivateKey = require('../test-wallets.js').accounts[0].secretKey;
    if (!ownerPrivateKey) {
      throw new Error('INVALID_OWNER_PK');
    }

    const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

    await expect(
      plmyTokenV2
        .connect(users[1].signer)
        .permit(ZERO_ADDRESS, spender, expiration, permitAmount, v, r, s)
    ).to.be.revertedWith('INVALID_OWNER');
  });

  it('Checks the total supply', async () => {
    const totalSupply = await plmyTokenV2.totalSupplyAt('0'); // Supply remains constant due no more mints
    expect(totalSupply).equal(parseEther('10000000'));
  });
  it('Checks the supply for liquidity mining', async () => {
    const { rewardsVault } = testEnv;
    expect(await plmyTokenV2.balanceOf(rewardsVault.address)).equal(parseEther('0'));
  });
  it('Checks the supply for vesting', async () => {
    const { mockVesting } = testEnv;
    expect(await plmyTokenV2.balanceOf(mockVesting.address)).equal(parseEther('10000000'));
  });
});
