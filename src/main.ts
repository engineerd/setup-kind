import * as core from '@actions/core';
import * as go from './go';
import { KindService } from './kind';

async function run() {
  try {
    checkEnvironment();
    const service: KindService = KindService.getInstance();
    const toolPath: string = await service.installKind();
    core.addPath(toolPath);
    await service.createCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

function checkEnvironment() {
  const supportedPlatforms: string[] = ['linux/amd64'];
  const platform = `${go.goos()}/${go.goarch()}`;
  if (!supportedPlatforms.includes(platform)) {
    throw new Error(`Platform "${platform}" is not supported`);
  }
}

run();
