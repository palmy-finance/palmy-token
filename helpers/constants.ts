import { tEthereumAddress } from './types';
import { getParamPerNetwork } from './misc-utils';
import { eEthereumNetwork } from './types-common';

export const BUIDLEREVM_CHAINID = 31337;
export const COVERAGE_CHAINID = 1337;

export const PERMISSIONED_CONTRACT_FACTORY_ADDRESS = '0x123e3ae459a8D049F27Ba62B8a5D48c68A100EBC';

export const ZERO_ADDRESS: tEthereumAddress = '0x0000000000000000000000000000000000000000';
export const ONE_ADDRESS = '0x0000000000000000000000000000000000000001';
export const MAX_UINT_AMOUNT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';
export const MOCK_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const WAD = Math.pow(10, 18).toString();

export const SUPPORTED_ETHERSCAN_NETWORKS = ['main', 'ropsten', 'kovan'];

export const getPlmyTokenDomainSeparatorPerNetwork = (
  network: eEthereumNetwork
): tEthereumAddress =>
  getParamPerNetwork<tEthereumAddress>(
    {
      [eEthereumNetwork.coverage]:
        '0x6334ce07fc771d21f0634439a587b364f00756c209bb425d2c4873b672e6d265',
      [eEthereumNetwork.hardhat]:
        '0x0485f89249ba7add63c320c24f13d8bd8e8d2e2e91cc6658e79271b0c88f8c8a',
      [eEthereumNetwork.kovan]: '',
      [eEthereumNetwork.testnet]: '',
      [eEthereumNetwork.oasys]: '',
    },
    network
  );
export const getIncentivesControllerPerNetwork = (network: eEthereumNetwork): tEthereumAddress =>
  getParamPerNetwork<tEthereumAddress>(
    {
      [eEthereumNetwork.coverage]: ZERO_ADDRESS,
      [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
      [eEthereumNetwork.kovan]: ZERO_ADDRESS,
      [eEthereumNetwork.testnet]: '0xF9989396817007b7Bb9290f0885821D8798c79e1', // proxy
      [eEthereumNetwork.oasys]: 'TODO',
    },
    network
  );
export const getWOASTokenPerNetwork = (network: eEthereumNetwork): tEthereumAddress =>
  getParamPerNetwork<tEthereumAddress>(
    {
      [eEthereumNetwork.coverage]: ZERO_ADDRESS,
      [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
      [eEthereumNetwork.kovan]: ZERO_ADDRESS,
      [eEthereumNetwork.testnet]: '0x5200000000000000000000000000000000000001',
      [eEthereumNetwork.oasys]: '0x5200000000000000000000000000000000000001',
    },
    network
  );

export const getPlmyTokenTreasuryAddressPerNetwork = (
  network: eEthereumNetwork
): tEthereumAddress =>
  getParamPerNetwork<tEthereumAddress>(
    {
      [eEthereumNetwork.coverage]: ZERO_ADDRESS,
      [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
      [eEthereumNetwork.kovan]: ZERO_ADDRESS,
      [eEthereumNetwork.testnet]: '0x99F9f5D8094137E9dD2647c2a3D94C0F773da24f',
      [eEthereumNetwork.oasys]: '0x99F9f5D8094137E9dD2647c2a3D94C0F773da24f',
    },
    network
  );
// PlmyProtoGovernance address as admin of PlmyToken and Migrator
export const getPlmyAdminPerNetwork = (network: eEthereumNetwork): tEthereumAddress =>
  getParamPerNetwork<tEthereumAddress>(
    {
      [eEthereumNetwork.coverage]: ZERO_ADDRESS,
      [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
      [eEthereumNetwork.kovan]: ZERO_ADDRESS,
      [eEthereumNetwork.testnet]: '0x21AFfDf04c787EB34f6Eda911d67CbA5D75d7773',
      [eEthereumNetwork.oasys]: '0x21AFfDf04c787EB34f6Eda911d67CbA5D75d7773',
    },
    network
  );

export const getVestingOwnerPerNetwork = (network: eEthereumNetwork): tEthereumAddress =>
  getParamPerNetwork<tEthereumAddress>(
    {
      [eEthereumNetwork.coverage]: ZERO_ADDRESS,
      [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
      [eEthereumNetwork.kovan]: ZERO_ADDRESS,
      [eEthereumNetwork.testnet]: '0x21AFfDf04c787EB34f6Eda911d67CbA5D75d7773',
      [eEthereumNetwork.oasys]: '0x21AFfDf04c787EB34f6Eda911d67CbA5D75d7773',
    },
    network
  );
