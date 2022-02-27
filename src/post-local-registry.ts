import * as core from '@actions/core';
import { Input } from './constants';
import { executeDocker } from './docker';
import { REGISTRY_NAME } from './local-registry';

export async function removeRegistry() {
  if (core.getInput(Input.LocalRegistry) === 'true') {
    await core.group(`Delete ${REGISTRY_NAME}`, async () => {
      const args = ['rm', '--force', REGISTRY_NAME];
      await executeDocker(args);
    });
  }
}
