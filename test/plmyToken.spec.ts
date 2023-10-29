import { parseEther } from 'ethers/lib/utils';
import { fail } from 'assert';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { TestEnv, makeSuite } from './helpers/make-suite';
import { ProtocolErrors } from '../helpers/types';
import { eEthereumNetwork } from '../helpers/types-common';
import { waitForTx, DRE } from '../helpers/misc-utils';
import {
  buildPermitParams,
  getSignatureFromTypedData,
  deployDoubleTransferHelper,
} from '../helpers/contracts-helpers';
import {
  getPlmyTokenDomainSeparatorPerNetwork,
  ZERO_ADDRESS,
  MAX_UINT_AMOUNT,
} from '../helpers/constants';

const { expect } = require('chai');

makeSuite('PLMY token', (testEnv: TestEnv) => {
  const {} = ProtocolErrors;

  it('Checks initial configuration', async () => {
    const { plmyToken } = testEnv;

    expect(await plmyToken.name()).to.be.equal('Plmy Token', 'Invalid token name');

    expect(await plmyToken.symbol()).to.be.equal('PLMY', 'Invalid token symbol');

    expect((await plmyToken.decimals()).toString()).to.be.equal('18', 'Invalid token decimals');
  });

  it('Checks the domain separator', async () => {
    const network = DRE.network.name;
    const DOMAIN_SEPARATOR_ENCODED = getPlmyTokenDomainSeparatorPerNetwork(
      network as eEthereumNetwork
    );
    const { plmyToken } = testEnv;

    const separator = await plmyToken.DOMAIN_SEPARATOR();
    expect(separator).to.be.equal(DOMAIN_SEPARATOR_ENCODED, 'Invalid domain separator');
  });

  it('Checks the revision', async () => {
    const { plmyToken: plmyToken } = testEnv;

    const revision = await plmyToken.REVISION();

    expect(revision.toString()).to.be.equal('1', 'Invalid revision');
  });

  it('Checks the allocation of the initial PLMY supply', async () => {
    const expectedDistributionBalance = new BigNumber(700000000).times(new BigNumber(10).pow(18));
    const { plmyToken, mockVesting } = testEnv;
    const distributedBalance = await plmyToken.balanceOf(mockVesting.address);

    expect(distributedBalance.toString()).to.be.equal(
      expectedDistributionBalance.toFixed(0),
      'Invalid distribution balance'
    );
  });

  it('Record correctly snapshot on release', async () => {
    const { plmyToken, deployer, mockVesting } = testEnv;

    await mockVesting.releaseMock(deployer.address, parseEther('2'));
    expect((await plmyToken.balanceOf(deployer.address)).toString()).to.be.equal(
      ethers.utils.parseEther('2'),
      'INVALID_BALANCE_AFTER_MIGRATION'
    );

    const userCountOfSnapshots = await plmyToken._countsSnapshots(deployer.address);
    const snapshot = await plmyToken._snapshots(deployer.address, userCountOfSnapshots.sub(1));
    expect(userCountOfSnapshots.toString()).to.be.equal('1', 'INVALID_SNAPSHOT_COUNT');
    expect(snapshot.value.toString()).to.be.equal(
      ethers.utils.parseEther('2'),
      'INVALID_SNAPSHOT_VALUE'
    );
  });

  it('Record correctly snapshot on transfer', async () => {
    const { plmyToken, deployer, users } = testEnv;
    const from = deployer.address;
    const to = users[1].address;
    await waitForTx(await plmyToken.transfer(to, ethers.utils.parseEther('1')));
    const fromCountOfSnapshots = await plmyToken._countsSnapshots(from);
    const fromLastSnapshot = await plmyToken._snapshots(from, fromCountOfSnapshots.sub(1));
    const fromPreviousSnapshot = await plmyToken._snapshots(from, fromCountOfSnapshots.sub(2));

    const toCountOfSnapshots = await plmyToken._countsSnapshots(to);
    const toSnapshot = await plmyToken._snapshots(to, toCountOfSnapshots.sub(1));

    expect(fromCountOfSnapshots.toString()).to.be.equal('2', 'INVALID_SNAPSHOT_COUNT');
    expect(fromLastSnapshot.value.toString()).to.be.equal(
      ethers.utils.parseEther('1'),
      'INVALID_SNAPSHOT_VALUE'
    );
    expect(fromPreviousSnapshot.value.toString()).to.be.equal(
      ethers.utils.parseEther('2'),
      'INVALID_SNAPSHOT_VALUE'
    );

    expect(toCountOfSnapshots.toString()).to.be.equal('1', 'INVALID_SNAPSHOT_COUNT');
    expect(toSnapshot.value.toString()).to.be.equal(
      ethers.utils.parseEther('1'),
      'INVALID_SNAPSHOT_VALUE'
    );
  });

  it('Reverts submitting a permit with 0 expiration', async () => {
    const { plmyToken: plmyToken, deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const expiration = 0;
    const nonce = (await plmyToken._nonces(owner)).toNumber();
    const permitAmount = ethers.utils.parseEther('2').toString();
    const msgParams = buildPermitParams(
      chainId,
      plmyToken.address,
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

    expect((await plmyToken.allowance(owner, spender)).toString()).to.be.equal(
      '0',
      'INVALID_ALLOWANCE_BEFORE_PERMIT'
    );

    const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

    await expect(
      plmyToken.connect(users[1].signer).permit(owner, spender, permitAmount, expiration, v, r, s)
    ).to.be.revertedWith('INVALID_EXPIRATION');

    expect((await plmyToken.allowance(owner, spender)).toString()).to.be.equal(
      '0',
      'INVALID_ALLOWANCE_AFTER_PERMIT'
    );
  });

  it('Submits a permit with maximum expiration length', async () => {
    const { plmyToken: plmyToken, deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    const configChainId = DRE.network.config.chainId;
    expect(configChainId).to.be.equal(chainId);
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const deadline = MAX_UINT_AMOUNT;
    const nonce = (await plmyToken._nonces(owner)).toNumber();
    const permitAmount = ethers.utils.parseEther('2').toString();
    const msgParams = buildPermitParams(
      chainId,
      plmyToken.address,
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

    expect((await plmyToken.allowance(owner, spender)).toString()).to.be.equal(
      '0',
      'INVALID_ALLOWANCE_BEFORE_PERMIT'
    );

    const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

    await waitForTx(
      await plmyToken
        .connect(users[1].signer)
        .permit(owner, spender, permitAmount, deadline, v, r, s)
    );

    expect((await plmyToken._nonces(owner)).toNumber()).to.be.equal(1);
  });

  it('Cancels the previous permit', async () => {
    const { plmyToken: plmyToken, deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const deadline = MAX_UINT_AMOUNT;
    const nonce = (await plmyToken._nonces(owner)).toNumber();
    const permitAmount = '0';
    const msgParams = buildPermitParams(
      chainId,
      plmyToken.address,
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

    expect((await plmyToken.allowance(owner, spender)).toString()).to.be.equal(
      ethers.utils.parseEther('2'),
      'INVALID_ALLOWANCE_BEFORE_PERMIT'
    );

    await waitForTx(
      await plmyToken
        .connect(users[1].signer)
        .permit(owner, spender, permitAmount, deadline, v, r, s)
    );
    expect((await plmyToken.allowance(owner, spender)).toString()).to.be.equal(
      permitAmount,
      'INVALID_ALLOWANCE_AFTER_PERMIT'
    );

    expect((await plmyToken._nonces(owner)).toNumber()).to.be.equal(2);
  });

  it('Tries to submit a permit with invalid nonce', async () => {
    const { plmyToken: plmyToken, deployer, users } = testEnv;
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
      plmyToken.address,
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
      plmyToken.connect(users[1].signer).permit(owner, spender, permitAmount, deadline, v, r, s)
    ).to.be.revertedWith('INVALID_SIGNATURE');
  });

  it('Tries to submit a permit with invalid expiration (previous to the current block)', async () => {
    const { plmyToken: plmyToken, deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const expiration = '1';
    const nonce = (await plmyToken._nonces(owner)).toNumber();
    const permitAmount = '0';
    const msgParams = buildPermitParams(
      chainId,
      plmyToken.address,
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
      plmyToken.connect(users[1].signer).permit(owner, spender, expiration, permitAmount, v, r, s)
    ).to.be.revertedWith('INVALID_EXPIRATION');
  });

  it('Tries to submit a permit with invalid signature', async () => {
    const { plmyToken: plmyToken, deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const deadline = MAX_UINT_AMOUNT;
    const nonce = (await plmyToken._nonces(owner)).toNumber();
    const permitAmount = '0';
    const msgParams = buildPermitParams(
      chainId,
      plmyToken.address,
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
      plmyToken.connect(users[1].signer).permit(owner, ZERO_ADDRESS, permitAmount, deadline, v, r, s)
    ).to.be.revertedWith('INVALID_SIGNATURE');
  });

  it('Tries to submit a permit with invalid owner', async () => {
    const { plmyToken: plmyToken, deployer, users } = testEnv;
    const owner = deployer.address;
    const spender = users[1].address;

    const { chainId } = await DRE.ethers.provider.getNetwork();
    if (!chainId) {
      fail("Current network doesn't have CHAIN ID");
    }
    const expiration = MAX_UINT_AMOUNT;
    const nonce = (await plmyToken._nonces(owner)).toNumber();
    const permitAmount = '0';
    const msgParams = buildPermitParams(
      chainId,
      plmyToken.address,
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
      plmyToken
        .connect(users[1].signer)
        .permit(ZERO_ADDRESS, spender, expiration, permitAmount, v, r, s)
    ).to.be.revertedWith('INVALID_OWNER');
  });

  it('Correct snapshotting on double action in the same block', async () => {
    const { plmyToken: plmyToken, deployer, users } = testEnv;

    const doubleTransferHelper = await deployDoubleTransferHelper(plmyToken.address);

    const receiver = users[2].address;

    await waitForTx(
      await plmyToken.transfer(
        doubleTransferHelper.address,
        (await plmyToken.balanceOf(deployer.address)).toString()
      )
    );

    await waitForTx(
      await doubleTransferHelper.doubleSend(
        receiver,
        ethers.utils.parseEther('0.2'),
        ethers.utils.parseEther('0.8')
      )
    );

    const countSnapshotsReceiver = (await plmyToken._countsSnapshots(receiver)).toString();

    const snapshotReceiver = await plmyToken._snapshots(doubleTransferHelper.address, 0);

    const countSnapshotsSender = (
      await plmyToken._countsSnapshots(doubleTransferHelper.address)
    ).toString();

    expect(countSnapshotsSender).to.be.equal('2', 'INVALID_COUNT_SNAPSHOTS_SENDER');
    const snapshotsSender = [
      await plmyToken._snapshots(doubleTransferHelper.address, 0),
      await plmyToken._snapshots(doubleTransferHelper.address, 1),
    ];

    expect(snapshotsSender[0].value.toString()).to.be.equal(
      ethers.utils.parseEther('1'),
      'INVALID_SENDER_SNAPSHOT'
    );
    expect(snapshotsSender[1].value.toString()).to.be.equal(
      ethers.utils.parseEther('0'),
      'INVALID_SENDER_SNAPSHOT'
    );

    expect(countSnapshotsReceiver).to.be.equal('1', 'INVALID_COUNT_SNAPSHOTS_RECEIVER');
    expect(snapshotReceiver.value.toString()).to.be.equal(ethers.utils.parseEther('1'));
  });

  it('Emits correctly mock event of the _beforeTokenTransfer hook', async () => {
    const { plmyToken: plmyToken, mockTransferHook, users } = testEnv;

    const recipient = users[2].address;

    await expect(plmyToken.connect(users[1].signer).transfer(recipient, 1)).to.emit(
      mockTransferHook,
      'MockHookEvent'
    );
  });

  it("Don't record snapshot when sending funds to itself", async () => {
    const { plmyToken: plmyToken, deployer, users } = testEnv;
    const from = users[2].address;
    const to = from;
    await waitForTx(
      await plmyToken.connect(users[2].signer).transfer(to, ethers.utils.parseEther('1'))
    );
    const fromCountOfSnapshots = await plmyToken._countsSnapshots(from);
    const fromLastSnapshot = await plmyToken._snapshots(from, fromCountOfSnapshots.sub(1));
    const fromPreviousSnapshot = await plmyToken._snapshots(from, fromCountOfSnapshots.sub(2));

    const toCountOfSnapshots = await plmyToken._countsSnapshots(to);
    const toSnapshot = await plmyToken._snapshots(to, toCountOfSnapshots.sub(1));

    expect(fromCountOfSnapshots.toString()).to.be.equal('2', 'INVALID_SNAPSHOT_COUNT');
    expect(fromLastSnapshot.value.toString()).to.be.equal(
      '1000000000000000001',
      'INVALID_SNAPSHOT_VALUE'
    );
    expect(fromPreviousSnapshot.value.toString()).to.be.equal(
      ethers.utils.parseEther('1'),
      'INVALID_SNAPSHOT_VALUE'
    );

    expect(toCountOfSnapshots.toString()).to.be.equal('2', 'INVALID_SNAPSHOT_COUNT');
    expect(toSnapshot.value.toString()).to.be.equal(
      '1000000000000000001',
      'INVALID_SNAPSHOT_VALUE'
    );
  });
});
