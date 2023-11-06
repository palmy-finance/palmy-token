import { task } from 'hardhat/config';
import { DRE } from '../../helpers/misc-utils';
import { Signer } from 'ethers';

task(`cancel-tx`, `cancel transaction with nonce`).setAction(async ({}, localBRE) => {
  await localBRE.run('set-dre');

  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }
  const signer = (await DRE.ethers.provider.getSigner()) as Signer;
  const tx = await signer.sendTransaction({
    to: '0x0000000000000000000000000000000000000000',
    value: 0,
    nonce: 7,
    gasLimit: 21000 * 330,
    //gasPrice: 50000000000,
    maxFeePerGas: 50000000000,
    maxPriorityFeePerGas: 50000000000,
    type: 2,
  });
});
