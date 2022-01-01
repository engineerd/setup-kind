import * as core from '@actions/core';
import { KindConfig, getKindConfig } from './kind';
import process from 'process';

async function run() {
  try {
    checkEnvironment();
    let cfg: KindConfig = getKindConfig();
    let toolPath: string = await cfg.installKind();
    core.addPath(toolPath);
    await cfg.createCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

function checkEnvironment() {
  const supportedPlatforms : string[] = ["linux/x64"];
  const platform : string = `${process.platform}/${process.arch}`;
  if (!supportedPlatforms.includes(platform)) {
    throw new Error(`Platform "${platform}" is not supported`) 
  } 
} 

run();
