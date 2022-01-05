import * as core from '@actions/core';
import * as go from './go';
import { KindMainService } from './kind/main';

async function run() {
  try {
    checkEnvironment();
    const service: KindMainService = KindMainService.getInstance();
    const toolPath: string = await service.installKind();
    core.addPath(toolPath);
    await service.createCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

function checkEnvironment() {
  const supportedPlatforms: string[] = ['linux/amd64', 'linux/arm64'];
  const platform = `${go.goos()}/${go.goarch()}`;
  if (!supportedPlatforms.includes(platform)) {
    throw new Error(`Platform "${platform}" is not supported`);
  }
}

run();
