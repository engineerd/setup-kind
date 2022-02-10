import * as core from '@actions/core';
import { KindMainService } from './kind/main';
import { checkEnvironment } from './requirements';
import { installTools } from './installer';

async function run() {
  const { kind, kubernetes } = await checkEnvironment();
  await installTools(kind, kubernetes);
  await KindMainService.getInstance().createCluster();
}

run().catch((error) => {
  core.setFailed((error as Error).message);
});
