import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import path from 'path';
import process from 'process';
import * as cache from '../cache';
import { Flag, Input, KIND_TOOL_NAME } from '../constants';
import { env as goenv } from '../go';
import { executeKindCommand, KIND_COMMAND } from './core';

export class KindMainService {
  configFile: string;
  image: string;
  name: string;
  waitDuration: string;
  kubeConfigFile: string;
  skipClusterCreation: boolean;
  verbosity: number;
  quiet: boolean;

  private constructor() {
    this.configFile = core.getInput(Input.Config);
    this.image = core.getInput(Input.Image);
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
  private async downloadKind(version: string): Promise<string> {
    const url = `https://github.com/kubernetes-sigs/kind/releases/download/${version}/kind-${goenv.GOOS}-${goenv.GOARCH}`;
    console.log('downloading kind from ' + url);
    const downloadPath = await tc.downloadTool(url);
    if (process.platform !== 'win32') {
      await exec.exec('chmod', ['+x', downloadPath]);
    }
    const toolPath: string = await tc.cacheFile(
      downloadPath,
      KIND_COMMAND,
      KIND_TOOL_NAME,
      version
    );
    core.debug(`kind is cached under ${toolPath}`);
    return toolPath;
  }

  async installKind(version: string): Promise<string> {
    const parameters = await cache.restoreKindCache(version);
    let toolPath: string = tc.find(KIND_TOOL_NAME, version);
    if (toolPath === '') {
      toolPath = await this.downloadKind(version);
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
