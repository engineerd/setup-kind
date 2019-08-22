import * as core from '@actions/core';
import { KindConfig, getKindConfig, downloadKind } from './kind';

async function run() {
  try {
    let cfg: KindConfig = getKindConfig();
    await downloadKind(cfg.version);
    await cfg.createCluster();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
