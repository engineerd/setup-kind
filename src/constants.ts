import process from 'process';

export enum Input {
  Version = 'version',
  Verbosity = 'verbosity',
  Quiet = 'quiet',
  Config = 'config',
  Image = 'image',
  LoadBalancer = 'loadBalancer',
  LocalRegistry = 'localRegistry',
  Name = 'name',
  Token = 'token',
  Wait = 'wait',
  KubeConfig = 'kubeconfig',
  SkipClusterCreation = 'skipClusterCreation',
  SkipClusterDeletion = 'skipClusterDeletion',
  SkipClusterLogsExport = 'skipClusterLogsExport',
}

export enum Flag {
  Version = '--version',
  Verbosity = '--verbosity',
  Quiet = '--quiet',
  Config = '--config',
  Image = '--image',
  Name = '--name',
  Wait = '--wait',
  KubeConfig = '--kubeconfig',
}

export const IS_WINDOWS = process.platform === 'win32';

function executableCommand(command: string) {
  return IS_WINDOWS ? `${command}.exe` : command;
}

export const DOCKER_COMMAND = executableCommand('docker');

export const KIND_COMMAND = executableCommand('kind');
export const KIND_DEFAULT_VERSION = 'v0.11.1';
export const KIND_TOOL_NAME = 'kind';

export const KUBECTL_COMMAND = executableCommand('kubectl');
export const KUBECTL_TOOL_NAME = 'kubectl';
