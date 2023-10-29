import { tEthereumAddress } from './types';
import { getParamPerNetwork } from './misc-utils';
import { eEthereumNetwork } from './types-common';

export const BUIDLEREVM_CHAINID = 31337;
export const COVERAGE_CHAINID = 1337;

export const ZERO_ADDRESS: tEthereumAddress = '0x0000000000000000000000000000000000000000';
export const ONE_ADDRESS = '0x0000000000000000000000000000000000000001';
export const MAX_UINT_AMOUNT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';
export const MOCK_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const WAD = Math.pow(10, 18).toString();

export const SUPPORTED_ETHERSCAN_NETWORKS = ['main', 'ropsten', 'kovan'];

export const getPlmyTokenDomainSeparatorPerNetwork = (network: eEthereumNetwork): tEthereumAddress =>
  getParamPerNetwork<tEthereumAddress>(
    {
      [eEthereumNetwork.coverage]:
        '0x6334ce07fc771d21f0634439a587b364f00756c209bb425d2c4873b672e6d265',
      [eEthereumNetwork.hardhat]:
        '0x0485f89249ba7add63c320c24f13d8bd8e8d2e2e91cc6658e79271b0c88f8c8a',
      [eEthereumNetwork.kovan]: '',
      [eEthereumNetwork.shibuya]: '',
      [eEthereumNetwork.shiden]: '',
      [eEthereumNetwork.astar]: '',
    },
    network
  );

// PlmyProtoGovernance address as admin of PlmyToken and Migrator
export const getPlmyAdminPerNetwork = (network: eEthereumNetwork): tEthereumAddress =>
  getParamPerNetwork<tEthereumAddress>(
    {
      [eEthereumNetwork.coverage]: ZERO_ADDRESS,
      [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
      [eEthereumNetwork.kovan]: '0x8134929c3dcb1b8b82f27f53424b959fb82182f2', // TODO: fix
      [eEthereumNetwork.shibuya]: '0xCBe964DC48dB9106088EB76Bb2FAD8D5a1bcdfbD', // personal wallet address. this is for only test env
      [eEthereumNetwork.shiden]: '0xCBe964DC48dB9106088EB76Bb2FAD8D5a1bcdfbD', // TODO: fix
      [eEthereumNetwork.astar]: '0x43BB799709758c266038cd56FC6aeF38c427f39E',
    },
    network
  );
