import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { Input } from './constants';
import { REGISTRY_NAME } from './local-registry';

export async function removeRegistry() {
  if (core.getInput(Input.LocalRegistry) === 'true') {
    await core.group(`Delete ${REGISTRY_NAME}`, async () => {
      const args = ['rm', '--force', REGISTRY_NAME];
      await exec.exec('docker', args);
    });
  }
}
