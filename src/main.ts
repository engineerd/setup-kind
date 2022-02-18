import * as core from '@actions/core';
import { installTools } from './installer';
import { KindMainService } from './kind/main';
import { setUpLoadBalancer } from './load-balancer';
import { finishRegistrySetup, initRegistrySetup } from './local-registry';
import { checkEnvironment } from './requirements';

async function run() {
  const { kind, kubernetes } = await checkEnvironment();
  await installTools(kind, kubernetes);
  const configFile = await initRegistrySetup();
  await KindMainService.getInstance().createCluster(configFile);
  await finishRegistrySetup();
  await setUpLoadBalancer();
}

run().catch((error) => {
  core.setFailed((error as Error).message);
});
