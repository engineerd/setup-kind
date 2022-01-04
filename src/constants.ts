export enum Input {
  Version = 'version',
  Verbosity = 'verbosity',
  Quiet = 'quiet',
  Config = 'config',
  Image = 'image',
  Name = 'name',
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
