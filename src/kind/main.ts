import * as core from '@actions/core';
import path from 'path';
import process from 'process';
import { Flag, Input } from '../constants';
import { executeKindCommand } from './core';

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
    this.skipClusterCreation = core.getInput(Input.SkipClusterCreation) === 'true';
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
      args.push(Flag.Quiet);
    }
    if (this.configFile != '') {
      args.push(
        Flag.Config,
        path.join(`${process.env['GITHUB_WORKSPACE'] || ''}`, this.configFile)
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

  async createCluster() {
    if (this.skipClusterCreation) {
      return;
    }
    await executeKindCommand(this.createCommand());
  }
}
