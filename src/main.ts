import * as core from '@actions/core';
import { KindConfig, getKindConfig, getKind } from './kind';

async function run() {
  try {
    let cfg: KindConfig = getKindConfig();
    let toolPath: string = await getKind(cfg.version);
    core.addPath(toolPath);
    await cfg.createCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();
