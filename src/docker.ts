import * as exec from '@actions/exec';
import { DOCKER_COMMAND } from './constants';

export async function executeDocker(args: string[], options?: exec.ExecOptions) {
  return await exec.exec(DOCKER_COMMAND, args, options);
}

export async function getDockerExecutionOutput(args: string[], options?: exec.ExecOptions) {
  return await exec.getExecOutput(DOCKER_COMMAND, args, options);
}
