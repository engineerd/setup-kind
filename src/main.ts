import * as core from '@actions/core';
import { installTools } from './installer';
import { KindMainService } from './kind/main';
import { setUpLoadBalancer } from './load-balancer';
import { checkEnvironment } from './requirements';

async function run() {
  const { kind, kubernetes } = await checkEnvironment();
  await installTools(kind, kubernetes);
  await KindMainService.getInstance().createCluster();
  await setUpLoadBalancer();
}

run().catch((error) => {
  core.setFailed((error as Error).message);
});
