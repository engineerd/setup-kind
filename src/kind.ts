import * as artifact from '@actions/artifact';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as glob from '@actions/glob';
import * as tc from '@actions/tool-cache';
import os from 'os';
import * as path from 'path';
import process from 'process';
import * as go from './go';
import * as cache from './cache';

const VersionInput = 'version';
const VerbosityInput = 'verbosity';
const QuietInput = 'quiet';
const ConfigInput = 'config';
const ImageInput = 'image';
const NameInput = 'name';
const WaitInput = 'wait';
const KubeConfigInput = 'kubeconfig';
const SkipClusterCreationInput = 'skipClusterCreation';
const SkipClusterDeletionInput = 'skipClusterDeletion';
const SkipClusterLogsExportInput = 'skipClusterLogsExport';
const toolName = 'kind';

export class KindService {
  version: string;
  configFile: string;
  image: string;
  name: string;
  waitDuration: string;
  kubeConfigFile: string;
  skipClusterCreation: boolean;
  skipClusterDeletion: boolean;
  skipClusterLogsExport: boolean;
  verbosity: number;
  quiet: boolean;

  private constructor() {
    this.version = core.getInput(VersionInput);
    this.configFile = core.getInput(ConfigInput);
    this.image = core.getInput(ImageInput);
    this.name = core.getInput(NameInput);
    this.waitDuration = core.getInput(WaitInput);
    this.kubeConfigFile = core.getInput(KubeConfigInput);
    this.skipClusterCreation =
      core.getInput(SkipClusterCreationInput) === 'true';
    this.skipClusterDeletion =
      core.getInput(SkipClusterDeletionInput) === 'true';
    this.skipClusterLogsExport =
      core.getInput(SkipClusterLogsExportInput) === 'true';
    this.verbosity = +core.getInput(VerbosityInput);
    this.quiet = core.getInput(QuietInput) === 'true';
  }

  public static getInstance(): KindService {
    return new KindService();
  }

  // returns the arguments to pass to `kind create cluster`
  createCommand(): string[] {
    const args: string[] = ['create', 'cluster'];
    if (this.verbosity > 0) {
      args.push('--verbosity', this.verbosity.toString());
    }
    if (this.quiet) {
      args.push('--quiet', this.quiet.toString());
    }
    if (this.configFile != '') {
      const wd: string = process.env[`GITHUB_WORKSPACE`] || '';
      const absPath: string = path.join(wd, this.configFile);
      args.push('--config', absPath);
    }
    if (this.image != '') {
      args.push('--image', this.image);
    }
    if (this.name != '') {
      args.push('--name', this.name);
    }
    if (this.waitDuration != '') {
      args.push('--wait', this.waitDuration);
    }
    if (this.kubeConfigFile != '') {
      args.push('--kubeconfig', this.kubeConfigFile);
    }
    return args;
  }

  // returns the arguments to pass to `kind delete cluster`
  deleteCommand(): string[] {
    const args: string[] = ['delete', 'cluster'];
    if (this.verbosity > 0) {
      args.push('--verbosity', this.verbosity.toString());
    }
    if (this.quiet) {
      args.push('--quiet', this.quiet.toString());
    }
    if (this.name != '') {
      args.push('--name', this.name);
    }
    if (this.kubeConfigFile != '') {
      args.push('--kubeconfig', this.kubeConfigFile);
    }
    return args;
  }

  // returns the arguments to pass to `kind export logs`
  exportLogsCommand(): string[] {
    const args: string[] = ['export', 'logs', this.kindLogsDir()];
    if (this.verbosity > 0) {
      args.push('--verbosity', this.verbosity.toString());
    }
    if (this.quiet) {
      args.push('--quiet', this.quiet.toString());
    }
    if (this.name != '') {
      args.push('--name', this.name);
    }
    return args;
  }

  // this action should always be run from a Linux worker
  private async downloadKind(): Promise<string> {
    const url = `https://github.com/kubernetes-sigs/kind/releases/download/${
      this.version
    }/kind-${go.goos()}-${go.goarch()}`;
    console.log('downloading kind from ' + url);
    let downloadPath: string | null = null;
    downloadPath = await tc.downloadTool(url);
    if (process.platform !== 'win32') {
      await exec.exec('chmod', ['+x', downloadPath]);
    }
    const toolPath: string = await tc.cacheFile(
      downloadPath,
      this.kindCommand(),
      toolName,
      this.version
    );
    core.debug(`kind is cached under ${toolPath}`);
    return toolPath;
  }

  private kindLogsDir(): string {
    const dirs: string[] = ['kind'];
    if (this.name != '') {
      dirs.push(this.name);
    }
    dirs.push('logs');
    return path.join(os.tmpdir(), ...dirs);
  }

  private artifactName(): string {
    const artifactArgs: string[] = ['kind'];
    if (this.name != '') {
      artifactArgs.push(this.name);
    }
    artifactArgs.push('logs');
    return artifactArgs.join('-');
  }

  private kindCommand(): string {
    return process.platform == 'win32' ? 'kind.exe' : 'kind';
  }

  async executeKindCommand(args: string[]) {
    const command = this.kindCommand();
    console.log(`Executing ${command} with args ` + args.join(' '));
    await exec.exec(command, args);
  }

  async installKind(): Promise<string> {
    const primaryKey = await cache.restoreKindCache(this.version);
    let toolPath: string = tc.find(toolName, this.version);
    if (toolPath === '') {
      toolPath = await this.downloadKind();
      await cache.saveKindCache(primaryKey);
    }
    return toolPath;
  }

  async uploadKindLogs() {
    const artifactClient = artifact.create();
    const rootDirectory = this.kindLogsDir();
    const pattern = rootDirectory + '/**/*';
    const globber = await glob.create(pattern);
    const files = await globber.glob();
    const options = {
      continueOnError: true,
    };
    await artifactClient.uploadArtifact(
      this.artifactName(),
      files,
      rootDirectory,
      options
    );
  }

  async createCluster() {
    if (this.skipClusterCreation) {
      return;
    }
    await this.executeKindCommand(this.createCommand());
  }

  async deleteCluster() {
    if (this.skipClusterDeletion) {
      return;
    }
    await this.executeKindCommand(this.deleteCommand());
  }

  async exportClusterLogs() {
    if (this.skipClusterLogsExport) {
      return;
    }
    await this.executeKindCommand(this.exportLogsCommand());
    await this.uploadKindLogs();
  }
}
