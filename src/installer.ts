import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import process from 'process';
import * as cache from './cache';
import {
  KIND_COMMAND,
  KIND_TOOL_NAME,
  KUBECTL_COMMAND,
  KUBECTL_TOOL_NAME,
} from './constants';

export async function installTools(
  kind: {
    version: string;
    url: string;
  },
  kubectl: {
    version: string;
    url: string;
  }
) {
  const { paths, primaryKey } = await cache.restoreSetupKindCache(
    kind.version,
    kubectl.version
  );
  const kindDownloaded = await installKind(kind.version, kind.url);
  const kubectlDownloaded = await installKubectl(kubectl.version, kubectl.url);
  if (kindDownloaded || kubectlDownloaded) {
    await cache.saveSetupKindCache(paths, primaryKey);
  }
}

async function installKind(version: string, url: string) {
  return await installTool(KIND_COMMAND, KIND_TOOL_NAME, version, url);
}
async function installKubectl(version: string, url: string) {
  return await installTool(KUBECTL_COMMAND, KUBECTL_TOOL_NAME, version, url);
}

async function downloadTool(
  command: string,
  toolName: string,
  version: string,
  url: string
): Promise<string> {
  console.log(`downloading ${toolName} from ${url}`);
  const downloadPath = await tc.downloadTool(url);
  if (process.platform !== 'win32') {
    await exec.exec('chmod', ['+x', downloadPath]);
  }
  const toolPath: string = await tc.cacheFile(
    downloadPath,
    command,
    toolName,
    version
  );
  core.debug(`${toolName} is cached under ${toolPath}`);
  return toolPath;
}

async function installTool(
  command: string,
  toolName: string,
  version: string,
  url: string
) {
  let toolPath: string = tc.find(toolName, version);
  let downloaded = false;
  if (toolPath === '') {
    toolPath = await downloadTool(command, toolName, version, url);
    downloaded = true;
  }
  core.addPath(toolPath);
  return downloaded;
}
