import { InitializableAdminUpgradeabilityProxy } from '../../types/InitializableAdminUpgradeabilityProxy';
import { task } from 'hardhat/config';
import { eContractid } from '../../helpers/types';
import { getPlmyToken, getContract, getPlmyTokenV2 } from '../../helpers/contracts-helpers';
import { getPlmyAdminPerNetwork } from '../../helpers/constants';
import { eEthereumNetwork } from '../../helpers/types-common';

const { PlmyToken } = eContractid;

task(`upgrade-${PlmyToken}`, `Upgrade the ${PlmyToken} proxy contract`)
  .addOptionalParam(
    'admin',
    `The address to be added as an Admin role in ${PlmyToken} Transparent Proxy.`
  )
  .addFlag('onlyProxy', 'Initialize only the proxy contract, not the implementation contract')
  .setAction(async ({ admin, onlyProxy }, localBRE) => {
    await localBRE.run('set-dre');
    const network = localBRE.network.name as eEthereumNetwork;
    const plmyAdmin = admin || (await getPlmyAdminPerNetwork(network));

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    console.log(`\n- ${PlmyToken} initialization`);

    const plmyToken = await getPlmyToken();
    const plmyTokenProxy = await getContract<InitializableAdminUpgradeabilityProxy>(
      eContractid.InitializableAdminUpgradeabilityProxy,
      plmyToken.address
    );
    const plmyTokenV2 = await getPlmyTokenV2();

    console.log('\tUpgrading to Plmy Token V2');
    const v2EncodedInitialize = plmyTokenV2.interface.encodeFunctionData('initialize', []);
    await plmyTokenProxy.upgradeToAndCall(plmyTokenV2.address, v2EncodedInitialize);
    console.log('\tFinished Plmy Token Upgrade');
  });
