import * as core from '@actions/core';
import { KindPostService } from './kind/post';
import { removeRegistry } from './post-local-registry';

async function run() {
  const service: KindPostService = KindPostService.getInstance();
  await service.exportClusterLogs();
  await service.deleteCluster();
  await removeRegistry();
}

run().catch((error) => {
  core.setFailed((error as Error).message);
});
