import * as exec from '@actions/exec';
import process from 'process';

export const KIND_COMMAND = process.platform === 'win32' ? 'kind.exe' : 'kind';

export async function executeKindCommand(args: string[]) {
  await exec.exec(KIND_COMMAND, args);
}
