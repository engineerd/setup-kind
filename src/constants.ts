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

export const DOCKER_COMMAND = IS_WINDOWS ? 'docker.exe' : 'docker';

export const KIND_COMMAND = IS_WINDOWS ? 'kind.exe' : 'kind';
export const KIND_DEFAULT_VERSION = 'v0.11.1';
export const KIND_TOOL_NAME = 'kind';

export const KUBECTL_COMMAND = IS_WINDOWS ? 'kubectl.exe' : 'kubectl';
export const KUBECTL_TOOL_NAME = 'kubectl';
