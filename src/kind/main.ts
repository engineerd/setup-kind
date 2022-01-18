import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import { ok } from 'assert';
import path from 'path';
import process from 'process';
import * as semver from 'semver';
import * as cache from '../cache';
import {
  Flag,
  Input,
  KIND_DEFAULT_VERSION,
  KIND_TOOL_NAME,
} from '../constants';
import { env as goenv } from '../go';
import { executeKindCommand, KIND_COMMAND } from './core';

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
    this.checkVersion();
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
   * Verify that the version of kind is a valid semver and prints a warning if the kind version used is older than the default for setup-kind
   */
  private checkVersion() {
    const cleanVersion = semver.clean(this.version);
    ok(
      cleanVersion,
      `Input ${Input.Version} expects a valid version like ${KIND_DEFAULT_VERSION}`
    );
    if (semver.lt(this.version, KIND_DEFAULT_VERSION)) {
      core.warning(
        `Kind ${KIND_DEFAULT_VERSION} is available, have you considered using it ? See https://github.com/kubernetes-sigs/kind/releases/tag/${KIND_DEFAULT_VERSION}`
      );
    }
  }

  /**
   * Prints a warning if a kindest/node is used without sha256.
   * This follows the recommendation from https://kind.sigs.k8s.io/docs/user/working-offline/#using-a-prebuilt-node-imagenode-image
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
    const url = `https://github.com/kubernetes-sigs/kind/releases/download/${this.version}/kind-${goenv.GOOS}-${goenv.GOARCH}`;
    console.log('downloading kind from ' + url);
    const downloadPath = await tc.downloadTool(url);
    if (process.platform !== 'win32') {
      await exec.exec('chmod', ['+x', downloadPath]);
    }
    const toolPath: string = await tc.cacheFile(
      downloadPath,
      KIND_COMMAND,
      KIND_TOOL_NAME,
      this.version
    );
    core.debug(`kind is cached under ${toolPath}`);
    return toolPath;
  }

  async installKind(): Promise<string> {
    const parameters = await cache.restoreKindCache(this.version);
    let toolPath: string = tc.find(KIND_TOOL_NAME, this.version);
    if (toolPath === '') {
      toolPath = await this.downloadKind();
      await cache.saveKindCache(parameters);
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
