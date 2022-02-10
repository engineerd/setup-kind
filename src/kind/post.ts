import * as artifact from '@actions/artifact';
import * as core from '@actions/core';
import * as glob from '@actions/glob';
import path from 'path';
import process from 'process';
import { v5 as uuidv5 } from 'uuid';
import { Flag, Input, KIND_TOOL_NAME } from '../constants';
import { executeKindCommand } from './core';

export class KindPostService {
  name: string;
  kubeConfigFile: string;
  skipClusterDeletion: boolean;
  skipClusterLogsExport: boolean;
  verbosity: number;
  quiet: boolean;

  private constructor() {
    this.name = core.getInput(Input.Name);
    this.kubeConfigFile = core.getInput(Input.KubeConfig);
    this.skipClusterDeletion = core.getInput(Input.SkipClusterDeletion) === 'true';
    this.skipClusterLogsExport = core.getInput(Input.SkipClusterLogsExport) === 'true';
    this.verbosity = +core.getInput(Input.Verbosity);
    this.quiet = core.getInput(Input.Quiet) === 'true';
  }

  public static getInstance(): KindPostService {
    return new KindPostService();
  }

  // returns the arguments to pass to `kind delete cluster`
  deleteCommand(): string[] {
    const args: string[] = ['delete', 'cluster'];
    if (this.verbosity > 0) {
      args.push(Flag.Verbosity, this.verbosity.toString());
    }
    if (this.quiet) {
      args.push(Flag.Quiet);
    }
    if (this.name != '') {
      args.push(Flag.Name, this.name);
    }
    if (this.kubeConfigFile != '') {
      args.push(Flag.KubeConfig, this.kubeConfigFile);
    }
    return args;
  }

  // returns the arguments to pass to `kind export logs`
  exportLogsCommand(): string[] {
    const args: string[] = ['export', 'logs', this.kindLogsDir()];
    if (this.verbosity > 0) {
      args.push(Flag.Verbosity, this.verbosity.toString());
    }
    if (this.quiet) {
      args.push(Flag.Quiet);
    }
    if (this.name != '') {
      args.push(Flag.Name, this.name);
    }
    return args;
  }

  private kindLogsDir(): string {
    const dirs: string[] = [KIND_TOOL_NAME];
    if (this.name != '') {
      dirs.push(this.name);
    }
    dirs.push('logs');
    return path.join(`${process.env['RUNNER_TEMP'] || ''}`, uuidv5(dirs.join('/'), uuidv5.URL));
  }

  private artifactName(): string {
    const artifactArgs: string[] = [`${process.env['GITHUB_JOB'] || ''}`, KIND_TOOL_NAME];
    if (this.name != '') {
      artifactArgs.push(this.name);
    }
    artifactArgs.push('logs');
    return artifactArgs.join('-');
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
    await artifactClient.uploadArtifact(this.artifactName(), files, rootDirectory, options);
  }

  async deleteCluster() {
    if (this.skipClusterDeletion) {
      return;
    }
    await executeKindCommand(this.deleteCommand());
  }

  async exportClusterLogs() {
    if (this.skipClusterLogsExport) {
      return;
    }
    await executeKindCommand(this.exportLogsCommand());
    await this.uploadKindLogs();
  }
}
