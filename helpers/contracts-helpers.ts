import { MockIncentivesController } from './../types/MockIncentivesController.d';
import { VestingInput } from './vesting-helpers';
import { PalmyRewardsVault } from './../types/PalmyRewardsVault.d';
import { MockTokenVesting } from './../types/MockTokenVesting.d';
import { TokenVesting } from './../types/TokenVesting.d';
import { PlmyTokenV2 } from './../types/PlmyTokenV2.d';
import { PlmyToken } from './../types/PlmyToken.d';
import { Contract, Signer, utils, ethers, BytesLike } from 'ethers';

import { getDb, DRE, waitForTx } from './misc-utils';
import { tEthereumAddress, eContractid, tStringTokenSmallUnits } from './types';
import { MOCK_ETH_ADDRESS, SUPPORTED_ETHERSCAN_NETWORKS } from './constants';
import BigNumber from 'bignumber.js';
import { Ierc20Detailed } from '../types/Ierc20Detailed';
import { InitializableAdminUpgradeabilityProxy } from '../types/InitializableAdminUpgradeabilityProxy';
import { MintableErc20 } from '../types/MintableErc20';
import { signTypedData_v4, TypedData } from 'eth-sig-util';
import { fromRpcSig, ECDSASignature } from 'ethereumjs-util';
import { DoubleTransferHelper } from '../types/DoubleTransferHelper';
import { MockTransferHook } from '../types/MockTransferHook';
import { verifyContract } from './etherscan-verification';

export const saveDeploymentCallData = async (contractId: string, callData: BytesLike) => {
  const currentNetwork = DRE.network.name;
  // save calldata into .deployments/calldata/<network>/<contractId>.calldata
  // directory of this file
  const path = require('path');
  const fs = require('fs');
  const dir = path.join(__dirname, '..', '.deployments', 'calldata', currentNetwork);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const fileName = path.join(dir, `${contractId}.calldata`);
  fs.writeFileSync(fileName, callData);
};

export const registerContractInJsonDb = async (contractId: string, contractInstance: Contract) => {
  const currentNetwork = DRE.network.name;
  if (currentNetwork !== 'hardhat' && currentNetwork !== 'coverage') {
    console.log(`\n\t  *** ${contractId} ***\n`);
    console.log(`\t  Network: ${currentNetwork}`);
    console.log(`\t  tx: ${contractInstance.deployTransaction.hash}`);
    console.log(`\t  contract address: ${contractInstance.address}`);
    console.log(`\t  deployer address: ${contractInstance.deployTransaction.from}`);
    console.log(`\t  gas price: ${contractInstance.deployTransaction.gasPrice}`);
    console.log(`\t  gas used: ${contractInstance.deployTransaction.gasLimit}`);
    console.log(`\t  ******`);
    console.log();
  }

  await getDb()
    .set(`${contractId}.${currentNetwork}`, {
      address: contractInstance.address,
      deployer: contractInstance.deployTransaction.from,
    })
    .write();
};

export const insertContractAddressInDb = async (id: eContractid, address: tEthereumAddress) =>
  await getDb()
    .set(`${id}.${DRE.network.name}`, {
      address,
    })
    .write();

export const getEthersSigners = async (): Promise<Signer[]> =>
  await Promise.all(await DRE.ethers.getSigners());

export const getEthersSignersAddresses = async (): Promise<tEthereumAddress[]> =>
  await Promise.all((await DRE.ethers.getSigners()).map((signer) => signer.getAddress()));

export const getCurrentBlock = async () => {
  return DRE.ethers.provider.getBlockNumber();
};

export const decodeAbiNumber = (data: string): number =>
  parseInt(utils.defaultAbiCoder.decode(['uint256'], data).toString());

const deployContract = async <ContractType extends Contract>(
  contractName: string,
  args: any[],
  verify?: boolean
): Promise<ContractType> => {
  const contract = (await (
    await DRE.ethers.getContractFactory(contractName)
  ).deploy(...args)) as ContractType;
  await waitForTx(contract.deployTransaction);
  await registerContractInJsonDb(<eContractid>contractName, contract);
  await contract.deployTransaction.wait();
  if (verify) {
    await verifyContract(contractName, contract.address, args);
  }
  return contract;
};

const getDeploymentCallData = async (contractName: string, args: any[]): Promise<BytesLike> => {
  const contract = (await DRE.ethers.getContractFactory(contractName)).getDeployTransaction(
    ...args
  );
  return contract.data!;
};

export const getContract = async <ContractType extends Contract>(
  contractName: string,
  address: string
): Promise<ContractType> => (await DRE.ethers.getContractAt(contractName, address)) as ContractType;

export const deployPlmyToken = async (verify?: boolean) => {
  const id = eContractid.PlmyToken;
  const args: string[] = [];
  const instance = await deployContract<PlmyToken>(id, args);
  await instance.deployTransaction.wait();
  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const exportPlmyTokenDeploymentCallData = async () => {
  const id = eContractid.PlmyToken;
  const args: string[] = [];
  return await getDeploymentCallData(id, args);
};

export const deployPlmyTokenV2 = async (verify?: boolean): Promise<PlmyTokenV2> => {
  const id = eContractid.PlmyTokenV2;
  const args: string[] = [];
  const instance = await deployContract<PlmyTokenV2>(id, args);
  await instance.deployTransaction.wait();
  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const exportPlmyTokenV2DeploymentCallData = async () => {
  const id = eContractid.PlmyTokenV2;
  const args: string[] = [];
  return await getDeploymentCallData(id, args);
};

export const deployRewardsVault = async (verify?: boolean): Promise<PalmyRewardsVault> => {
  const id = eContractid.PalmyRewardsVault;
  const args: string[] = [];
  const instance = await deployContract<PalmyRewardsVault>(id, args);
  await instance.deployTransaction.wait();
  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const exportRewardsVaultCallData = async () => {
  const id = eContractid.PalmyRewardsVault;
  const args: string[] = [];
  return await getDeploymentCallData(id, args);
};

export const deployMintableErc20 = async ([name, symbol, decimals]: [string, string, number]) =>
  await deployContract<MintableErc20>(eContractid.MintableErc20, [name, symbol, decimals]);

export const deployVesting = async (plmyTokenAddress: string, owner: string, verify?: boolean) => {
  const id = eContractid.TokenVesting;
  const args = [plmyTokenAddress, owner];
  const instance = await deployContract<TokenVesting>(id, args);
  await instance.deployTransaction.wait();
  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const deployToOasysTestnet = async (id: eContractid) => {
  const path = require('path');
  const fs = require('fs');
  const dir = path.join(__dirname, '..', '.deployments', 'calldata', 'testnet');
  const file = path.join(dir, `${id}.calldata`);
  if (!fs.existsSync(file)) {
    throw new Error(`File ${file} not found`);
  }
  const calldata = fs.readFileSync(file, 'utf8');
  const signer = (await getEthersSigners())[0];
  const tx = await signer.sendTransaction({
    data: calldata,
    to: undefined,
    type: 2,
  });
  await tx.wait();
};

export const exportVestingDeploymentCallData = async (initialOwner: string) => {
  const id = eContractid.TokenVesting;
  const args: string[] = [initialOwner];
  return await getDeploymentCallData(id, args);
};

export const deployMockVesting = async (
  plmyTokenAddress: string,
  owner: string,
  verify?: boolean
) => {
  const id = eContractid.MockTokenVesting;
  const args = [plmyTokenAddress, owner];
  const instance = await deployContract<MockTokenVesting>(id, args);
  await instance.deployTransaction.wait();
  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const deployDoubleTransferHelper = async (plmyToken: tEthereumAddress, verify?: boolean) => {
  const id = eContractid.DoubleTransferHelper;
  const args = [plmyToken];
  const instance = await deployContract<DoubleTransferHelper>(id, args);
  await instance.deployTransaction.wait();
  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const deployMockTransferHook = async () =>
  await deployContract<MockTransferHook>(eContractid.MockTransferHook, []);

export const deployMockIncentivesController = async (
  vault: tEthereumAddress,
  token: tEthereumAddress
) =>
  await deployContract<MockIncentivesController>(eContractid.MockIncentivesController, [
    vault,
    token,
  ]);

export const deployInitializableAdminUpgradeabilityProxy = async (verify?: boolean) => {
  const id = eContractid.InitializableAdminUpgradeabilityProxy;
  const args: string[] = [];
  const instance = await deployContract<InitializableAdminUpgradeabilityProxy>(id, args);
  await instance.deployTransaction.wait();
  if (verify) {
    await verifyContract(id, instance.address, args);
  }
  return instance;
};

export const exportInitializableAdminUpgradeabilityProxyCallData = async () => {
  const id = eContractid.InitializableAdminUpgradeabilityProxy;
  const args: string[] = [];
  return await getDeploymentCallData(id, args);
};

export const getPlmyToken = async (address?: tEthereumAddress) => {
  return await getContract<PlmyToken>(
    eContractid.PlmyToken,
    address || (await getDb().get(`${eContractid.PlmyToken}.${DRE.network.name}`).value()).address
  );
};

export const getPalmyRewardsVaultImpl = async (address?: tEthereumAddress) => {
  return await getContract<PalmyRewardsVault>(
    eContractid.PalmyRewardsVaultImpl,
    address ||
      (
        await getDb().get(`${eContractid.PalmyRewardsVaultImpl}.${DRE.network.name}`).value()
      ).address
  );
};
export const getPalmyRewardsVaultProxy = async (address?: tEthereumAddress) => {
  return await getContract<InitializableAdminUpgradeabilityProxy>(
    eContractid.PalmyRewardsVaultProxy,
    address ||
      (
        await getDb().get(`${eContractid.PalmyRewardsVaultProxy}.${DRE.network.name}`).value()
      ).address
  );
};

export const getPalmyRewardsVault = async (address?: tEthereumAddress) => {
  return await getContract<PalmyRewardsVault>(
    eContractid.PalmyRewardsVault,
    address ||
      (
        await getDb().get(`${eContractid.PalmyRewardsVault}.${DRE.network.name}`).value()
      ).address
  );
};

export const getPlmyTokenImpl = async (address?: tEthereumAddress) => {
  return await getContract<PlmyToken>(
    eContractid.PlmyToken,
    address ||
      (
        await getDb().get(`${eContractid.PlmyTokenImpl}.${DRE.network.name}`).value()
      ).address
  );
};

export const newVestingSchedule = async (instance: TokenVesting, input: VestingInput) => {
  return await instance.createVestingSchedule(
    input.beneficiary,
    input.start,
    input.cliff,
    input.duration,
    input.slicePerSeconds,
    input.revocable,
    input.amount
  );
};

export const getMintableErc20 = async (address: tEthereumAddress) => {
  return await getContract<MintableErc20>(
    eContractid.MintableErc20,
    address ||
      (
        await getDb().get(`${eContractid.MintableErc20}.${DRE.network.name}`).value()
      ).address
  );
};

export const getDoubleTransferHelper = async (address: tEthereumAddress) => {
  return await getContract<DoubleTransferHelper>(
    eContractid.DoubleTransferHelper,
    address ||
      (
        await getDb().get(`${eContractid.DoubleTransferHelper}.${DRE.network.name}`).value()
      ).address
  );
};

export const getMockTransferHook = async (address?: tEthereumAddress) => {
  return await getContract<MockTransferHook>(
    eContractid.MockTransferHook,
    address ||
      (
        await getDb().get(`${eContractid.MockTransferHook}.${DRE.network.name}`).value()
      ).address
  );
};

export const getMockTokenVesting = async (address?: tEthereumAddress) => {
  return await getContract<MockTokenVesting>(
    eContractid.MockTokenVesting,
    address ||
      (
        await getDb().get(`${eContractid.MockTokenVesting}.${DRE.network.name}`).value()
      ).address
  );
};

export const getMockIncentivesController = async (address?: tEthereumAddress) => {
  return await getContract<MockIncentivesController>(
    eContractid.MockIncentivesController,
    address ||
      (
        await getDb().get(`${eContractid.MockIncentivesController}.${DRE.network.name}`).value()
      ).address
  );
};

export const getTokenVesting = async (address?: tEthereumAddress) => {
  return await getContract<TokenVesting>(
    eContractid.TokenVesting,
    address ||
      (
        await getDb().get(`${eContractid.TokenVesting}.${DRE.network.name}`).value()
      ).address
  );
};

export const getIErc20Detailed = async (address: tEthereumAddress) => {
  return await getContract<Ierc20Detailed>(
    eContractid.IERC20Detailed,
    address ||
      (
        await getDb().get(`${eContractid.IERC20Detailed}.${DRE.network.name}`).value()
      ).address
  );
};

export const getInitializableAdminUpgradeabilityProxy = async (address: tEthereumAddress) => {
  return await getContract<InitializableAdminUpgradeabilityProxy>(
    eContractid.InitializableAdminUpgradeabilityProxy,
    address ||
      (
        await getDb()
          .get(`${eContractid.InitializableAdminUpgradeabilityProxy}.${DRE.network.name}`)
          .value()
      ).address
  );
};

export const convertToCurrencyDecimals = async (tokenAddress: tEthereumAddress, amount: string) => {
  const isEth = tokenAddress === MOCK_ETH_ADDRESS;
  let decimals = '18';

  if (!isEth) {
    const token = await getIErc20Detailed(tokenAddress);
    decimals = (await token.decimals()).toString();
  }

  return ethers.utils.parseUnits(amount, decimals);
};

export const convertToCurrencyUnits = async (tokenAddress: string, amount: string) => {
  const isEth = tokenAddress === MOCK_ETH_ADDRESS;

  let decimals = new BigNumber(18);
  if (!isEth) {
    const token = await getIErc20Detailed(tokenAddress);
    decimals = new BigNumber(await token.decimals());
  }
  const currencyUnit = new BigNumber(10).pow(decimals);
  const amountInCurrencyUnits = new BigNumber(amount).div(currencyUnit);
  return amountInCurrencyUnits.toFixed();
};

export const buildPermitParams = (
  chainId: number,
  plmyToken: tEthereumAddress,
  owner: tEthereumAddress,
  spender: tEthereumAddress,
  nonce: number,
  deadline: string,
  value: tStringTokenSmallUnits
) => ({
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  primaryType: 'Permit' as const,
  domain: {
    name: 'Plmy Token',
    version: '1',
    chainId: chainId,
    verifyingContract: plmyToken,
  },
  message: {
    owner,
    spender,
    value,
    nonce,
    deadline,
  },
});

export const buildDelegateByTypeParams = (
  chainId: number,
  plmyToken: tEthereumAddress,
  delegatee: tEthereumAddress,
  type: string,
  nonce: string,
  expiry: string
) => ({
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    DelegateByType: [
      { name: 'delegatee', type: 'address' },
      { name: 'type', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
    ],
  },
  primaryType: 'DelegateByType' as const,
  domain: {
    name: 'Plmy Token',
    version: '1',
    chainId: chainId,
    verifyingContract: plmyToken,
  },
  message: {
    delegatee,
    type,
    nonce,
    expiry,
  },
});

export const buildDelegateParams = (
  chainId: number,
  plmyToken: tEthereumAddress,
  delegatee: tEthereumAddress,
  nonce: string,
  expiry: string
) => ({
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Delegate: [
      { name: 'delegatee', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
    ],
  },
  primaryType: 'Delegate' as const,
  domain: {
    name: 'Plmy Token',
    version: '1',
    chainId: chainId,
    verifyingContract: plmyToken,
  },
  message: {
    delegatee,
    nonce,
    expiry,
  },
});

export const getSignatureFromTypedData = (
  privateKey: string,
  typedData: any // TODO: should be TypedData, from eth-sig-utils, but TS doesn't accept it
): ECDSASignature => {
  const signature = signTypedData_v4(Buffer.from(privateKey.substring(2, 66), 'hex'), {
    data: typedData,
  });
  return fromRpcSig(signature);
};
