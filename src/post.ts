import * as core from '@actions/core';
import { KindConfig, getKindConfig } from './kind';

async function run() {
  try {
    const cfg: KindConfig = getKindConfig();
    await cfg.exportClusterLogs();
    await cfg.deleteCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();
