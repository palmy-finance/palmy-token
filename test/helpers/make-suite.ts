import { MockIncentivesController } from './../../types/MockIncentivesController.d';
import {
  getMintableErc20,
  getMockIncentivesController,
  getPalmyRewardsVault,
} from './../../helpers/contracts-helpers';
import { PlmyToken } from './../../types/PlmyToken.d';
import { evmRevert, evmSnapshot, DRE } from '../../helpers/misc-utils';
import { Signer } from 'ethers';
import {
  getEthersSigners,
  getPlmyToken,
  getMockTokenVesting,
  getMockTransferHook,
} from '../../helpers/contracts-helpers';
import { tEthereumAddress } from '../../helpers/types';

import chai from 'chai';
// @ts-ignore
import bignumberChai from 'chai-bignumber';
import { MockTransferHook } from '../../types/MockTransferHook';
import { MockTokenVesting } from '../../types/MockTokenVesting';
import { PalmyRewardsVault } from '../../types/PalmyRewardsVault';
import { MintableErc20 } from '../../types/MintableErc20';

chai.use(bignumberChai());

export interface SignerWithAddress {
  signer: Signer;
  address: tEthereumAddress;
}
export interface TestEnv {
  deployer: SignerWithAddress;
  users: SignerWithAddress[];
  plmyToken: PlmyToken;
  mockTransferHook: MockTransferHook;
  mockVesting: MockTokenVesting;
  rewardsVault: PalmyRewardsVault;
  mockIncentivesController: MockIncentivesController;
  mockRewardToken: MintableErc20;
}

let buidlerevmSnapshotId: string = '0x1';
const setBuidlerevmSnapshotId = (id: string) => {
  if (DRE.network.name === 'hardhat') {
    buidlerevmSnapshotId = id;
  }
};

const testEnv: TestEnv = {
  deployer: {} as SignerWithAddress,
  users: [] as SignerWithAddress[],
  plmyToken: {} as PlmyToken,
  mockTransferHook: {} as MockTransferHook,
  mockVesting: {} as MockTokenVesting,
  mockIncentivesController: {} as MockIncentivesController,
  mockRewardToken: {} as MintableErc20,
} as TestEnv;

export async function initializeMakeSuite() {
  const [_deployer, ...restSigners] = await getEthersSigners();
  const deployer: SignerWithAddress = {
    address: await _deployer.getAddress(),
    signer: _deployer,
  };

  for (const signer of restSigners) {
    testEnv.users.push({
      signer,
      address: await signer.getAddress(),
    });
  }
  testEnv.deployer = deployer;
  testEnv.plmyToken = await getPlmyToken();
  testEnv.mockTransferHook = await getMockTransferHook();
  testEnv.mockVesting = await getMockTokenVesting();
  testEnv.rewardsVault = await getPalmyRewardsVault();
  testEnv.mockIncentivesController = await getMockIncentivesController();
  testEnv.mockRewardToken = await getMintableErc20();
}

export function makeSuite(name: string, tests: (testEnv: TestEnv) => void) {
  describe(name, () => {
    before(async () => {
      setBuidlerevmSnapshotId(await evmSnapshot());
    });
    tests(testEnv);
    after(async () => {
      await evmRevert(buidlerevmSnapshotId);
    });
  });
}
