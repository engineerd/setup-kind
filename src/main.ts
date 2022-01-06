import * as core from '@actions/core';
import { ok } from 'assert';
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
  ok(
    supportedPlatforms.includes(platform),
    `Platform "${platform}" is not supported`
  );
  const requiredVariables = [
    'GITHUB_WORKSPACE',
    'RUNNER_ARCH',
    'RUNNER_OS',
    'RUNNER_TOOL_CACHE',
  ];
  requiredVariables.forEach((variable) => {
    ok(`${process.env[variable]}`, `Expected ${variable} to be defined`);
  });
}

run();
