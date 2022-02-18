import * as exec from '@actions/exec';
import { KIND_COMMAND } from '../constants';

export async function executeKind(args: string[]) {
  await exec.exec(KIND_COMMAND, args);
}
