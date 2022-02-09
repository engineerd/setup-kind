import * as core from '@actions/core';
import { KindMainService } from './kind/main';
import { checkEnvironment } from './requirements';
import { installTools } from './installer';

async function run() {
  try {
    const { kind, kubectl } = await checkEnvironment();
    const service: KindMainService = KindMainService.getInstance();
    await installTools(kind, kubectl);
    await service.createCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();
