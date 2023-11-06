import { task } from 'hardhat/config';
import { eContractid } from '../../helpers/types';
import { deployToOasysTestnet } from '../../helpers/contracts-helpers';

const { TokenVesting } = eContractid;

task(`deploy-testnet`, `Deploy contract to testnet`)
  .addFlag('verify', 'Proceed with the Etherscan verification')
  .addParam('contract', 'Contract name')
  .setAction(async ({ verify, contract }, localBRE) => {
    await localBRE.run('set-dre');

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(`\n- ${contract} deployment`);
    const id = eContractid[contract as eContractid];
    const tx = await deployToOasysTestnet(id);
    console.log(`\tFinished ${contract} Implementation deployment.`);
  });
