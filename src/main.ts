import * as core from '@actions/core';
import { KindConfig, getKindConfig } from './kind';
import process from 'process';

async function run() {
  try {
    checkEnvironment();
    const cfg: KindConfig = getKindConfig();
    const toolPath: string = await cfg.installKind();
    core.addPath(toolPath);
    await cfg.createCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

function checkEnvironment() {
  const supportedPlatforms: string[] = ['linux/x64'];
  const platform = `${process.platform}/${process.arch}`;
  if (!supportedPlatforms.includes(platform)) {
    throw new Error(`Platform "${platform}" is not supported`);
  }
}

run();
