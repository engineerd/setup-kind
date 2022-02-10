import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import process from 'process';
import * as cache from './cache';
import { KIND_COMMAND, KIND_TOOL_NAME, KUBECTL_COMMAND, KUBECTL_TOOL_NAME } from './constants';

export async function installTools(
  kind: {
    version: string;
    url: string;
  },
  kubernetes: {
    version: string;
    url: string;
  }
): Promise<void> {
  const { paths, primaryKey } = await cache.restoreSetupKindCache(kind.version, kubernetes.version);
  const kindDownloaded = await installKind(kind.version, kind.url);
  const kubernetesDownloaded = await installKubernetesTools(kubernetes.version, kubernetes.url);
  if (kindDownloaded || kubernetesDownloaded) {
    await cache.saveSetupKindCache(paths, primaryKey);
  }
}

async function installKind(version: string, url: string): Promise<boolean> {
  return await installTool(KIND_COMMAND, KIND_TOOL_NAME, version, url);
}

async function installKubernetesTools(version: string, url: string): Promise<boolean> {
  if (version !== '' && url !== '') {
    return await installTool(
      KUBECTL_COMMAND,
      KUBECTL_TOOL_NAME,
      version,
      `${url}/${KUBECTL_COMMAND}`
    );
  }
  return false;
}

async function downloadTool(
  command: string,
  toolName: string,
  version: string,
  url: string
): Promise<string> {
  core.info(`Downloading ${toolName}@${version} from ${url}`);
  const downloadPath = await tc.downloadTool(url);
  if (process.platform !== 'win32') {
    await exec.exec('chmod', ['+x', downloadPath]);
  }
  return await tc.cacheFile(downloadPath, command, toolName, version);
}

async function installTool(
  command: string,
  toolName: string,
  version: string,
  url: string
): Promise<boolean> {
  let toolPath: string = tc.find(toolName, version);
  let downloaded = false;
  if (toolPath === '') {
    toolPath = await downloadTool(command, toolName, version, url);
    downloaded = true;
  }
  core.addPath(toolPath);
  core.info(`The tool ${toolName}@${version} is cached under ${toolPath}`);
  return downloaded;
}
