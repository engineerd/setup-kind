import * as core from '@actions/core';
import { KindMainService } from './kind/main';
import { checkEnvironment } from './requirements';

async function run() {
  try {
    const { version, url } = await checkEnvironment();
    const service: KindMainService = KindMainService.getInstance();
    const toolPath: string = await service.installKind(version, url);
    core.addPath(toolPath);
    await service.createCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();
