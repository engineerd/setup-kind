export enum Input {
  Version = 'version',
  Verbosity = 'verbosity',
  Quiet = 'quiet',
  Config = 'config',
  Image = 'image',
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

export const KIND_TOOL_NAME = 'kind';

export const KIND_DEFAULT_VERSION = 'v0.11.1';
