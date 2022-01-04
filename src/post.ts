import * as core from '@actions/core';
import { KindPostService } from './kind-post';

async function run() {
  try {
    const service: KindPostService = KindPostService.getInstance();
    await service.exportClusterLogs();
    await service.deleteCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();
