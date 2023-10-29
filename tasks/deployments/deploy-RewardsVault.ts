import { deployInitializableAdminUpgradeabilityProxy } from './../../helpers/contracts-helpers';
import { TokenVesting__factory } from '../../types/factories/TokenVesting__factory';
import { task } from 'hardhat/config';
import { registerContractInJsonDb, deployRewardsVault } from '../../helpers/contracts-helpers';
import { eContractid } from '../../helpers/types';

const { PalmyRewardsVault, PalmyRewardsVaultImpl, PalmyRewardsVaultProxy } = eContractid;

task(`deploy-${PalmyRewardsVault}`, `Deploys the ${PalmyRewardsVault} contract`)
  .addFlag('verify', 'Proceed with the Etherscan verification')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-dre');

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(`\n- ${PalmyRewardsVault} deployment`);

    console.log(`\tDeploying ${PalmyRewardsVault} implementation ...`);
    const rewardsVaultImpl = await deployRewardsVault(verify);
    await registerContractInJsonDb(PalmyRewardsVaultImpl, rewardsVaultImpl);
    console.log(`\tDeploying ${PalmyRewardsVault} proxy ...`);
    const rewardsVaultProxy = await deployInitializableAdminUpgradeabilityProxy(verify);
    await registerContractInJsonDb(PalmyRewardsVaultProxy, rewardsVaultProxy);

    console.log(`\tFinished ${PalmyRewardsVault} deployment`);
  });
