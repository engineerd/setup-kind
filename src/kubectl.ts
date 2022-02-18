import * as core from '@actions/core';
import * as exec from '@actions/exec';
import path from 'path';
import { v5 as uuidv5 } from 'uuid';
import { Input, KUBECTL_COMMAND, KUBECTL_TOOL_NAME } from './constants';
import { ConfigMap } from './kubernetes';
import { write } from './yaml-helper';

export async function executeKubectl(args: string[]) {
  await exec.exec(KUBECTL_COMMAND, args);
}

export async function apply(file: string) {
  const args: string[] = ['apply', '-f', file];
  await executeKubectl(args);
}

export async function applyConfigMap(configMap: ConfigMap, fileName: string) {
  const dirs: string[] = [KUBECTL_TOOL_NAME, core.getInput(Input.Name)];
  const dir = path.join(`${process.env['RUNNER_TEMP'] || ''}`, uuidv5(dirs.join('/'), uuidv5.URL));
  const file = write(dir, fileName, configMap);
  await apply(file);
}

export async function createMemberlistSecret(namespace: string) {
  const args: string[] = [
    'create',
    'secret',
    'generic',
    '-n',
    namespace,
    'memberlist',
    '--from-literal=secretkey="$(openssl rand -base64 128)"',
  ];
  await executeKubectl(args);
}

export async function waitForPodReady(namespace: string) {
  const args: string[] = [
    'wait',
    '-n',
    namespace,
    'pod',
    '--all',
    '--for=condition=ready',
    '--timeout=240s',
  ];
  await executeKubectl(args);
}
