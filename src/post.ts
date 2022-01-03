import * as core from '@actions/core';
import { KindService } from './kind';

async function run() {
  try {
    const service: KindService = KindService.getInstance();
    await service.exportClusterLogs();
    await service.deleteCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();
