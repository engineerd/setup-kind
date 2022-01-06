import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import path from 'path';
import process from 'process';
import * as go from '../go';
import * as cache from '../cache';
import { Input, Flag, KIND_TOOL_NAME } from '../constants';
import { kindCommand, executeKindCommand } from './core';

export class KindMainService {
  version: string;
  configFile: string;
  image: string;
  name: string;
  waitDuration: string;
  kubeConfigFile: string;
  skipClusterCreation: boolean;
  verbosity: number;
  quiet: boolean;

  private constructor() {
    this.version = core.getInput(Input.Version, { required: true });
    this.configFile = core.getInput(Input.Config);
    this.image = core.getInput(Input.Image);
    this.checkImage();
    this.name = core.getInput(Input.Name, { required: true });
    this.waitDuration = core.getInput(Input.Wait);
    this.kubeConfigFile = core.getInput(Input.KubeConfig);
    this.skipClusterCreation =
      core.getInput(Input.SkipClusterCreation) === 'true';
    this.verbosity = +core.getInput(Input.Verbosity);
    this.quiet = core.getInput(Input.Quiet) === 'true';
  }

  public static getInstance(): KindMainService {
    return new KindMainService();
  }

  /**
   * Prints a warning if a kindest/node is used without sha256.
   * This follows https://kind.sigs.k8s.io/docs/user/working-offline/#using-a-prebuilt-node-imagenode-image recommendation
   */
  private checkImage() {
    if (
      this.image !== '' &&
      this.image.startsWith('kindest/node') &&
      !this.image.includes('@sha256:')
    ) {
      core.warning(
        `Please include the @sha256: image digest from the image in the release notes. You can find available image tags on the release page, https://github.com/kubernetes-sigs/kind/releases/tag/${this.version}`
      );
    }
  }

  // returns the arguments to pass to `kind create cluster`
  createCommand(): string[] {
    const args: string[] = ['create', 'cluster'];
    if (this.verbosity > 0) {
      args.push(Flag.Verbosity, this.verbosity.toString());
    }
    if (this.quiet) {
      args.push(Flag.Quiet, this.quiet.toString());
    }
    if (this.configFile != '') {
      args.push(
        Flag.Config,
        path.join(`${process.env['GITHUB_WORKSPACE']}`, this.configFile)
      );
    }
    if (this.image != '') {
      args.push(Flag.Image, this.image);
    }
    if (this.name != '') {
      args.push(Flag.Name, this.name);
    }
    if (this.waitDuration != '') {
      args.push(Flag.Wait, this.waitDuration);
    }
    if (this.kubeConfigFile != '') {
      args.push(Flag.KubeConfig, this.kubeConfigFile);
    }
    return args;
  }

  // this action should always be run from a Linux worker
  private async downloadKind(): Promise<string> {
    const url = `https://github.com/kubernetes-sigs/kind/releases/download/${
      this.version
    }/kind-${go.goos()}-${go.goarch()}`;
    console.log('downloading kind from ' + url);
    const downloadPath = await tc.downloadTool(url);
    if (process.platform !== 'win32') {
      await exec.exec('chmod', ['+x', downloadPath]);
    }
    const toolPath: string = await tc.cacheFile(
      downloadPath,
      kindCommand(),
      KIND_TOOL_NAME,
      this.version
    );
    core.debug(`kind is cached under ${toolPath}`);
    return toolPath;
  }

  async installKind(): Promise<string> {
    const primaryKey = await cache.restoreKindCache(this.version);
    let toolPath: string = tc.find(KIND_TOOL_NAME, this.version);
    if (toolPath === '') {
      toolPath = await this.downloadKind();
      await cache.saveKindCache(primaryKey);
    }
    return toolPath;
  }

  async createCluster() {
    if (this.skipClusterCreation) {
      return;
    }
    await executeKindCommand(this.createCommand());
  }
}
