import process from 'process';

export enum Input {
  Version = 'version',
  Verbosity = 'verbosity',
  Quiet = 'quiet',
  Config = 'config',
  Image = 'image',
  LoadBalancer = 'loadBalancer',
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

export const KIND_COMMAND = process.platform === 'win32' ? 'kind.exe' : 'kind';
export const KIND_DEFAULT_VERSION = 'v0.11.1';
export const KIND_TOOL_NAME = 'kind';

export const KUBECTL_COMMAND = process.platform === 'win32' ? 'kubectl.exe' : 'kubectl';
export const KUBECTL_TOOL_NAME = 'kubectl';
