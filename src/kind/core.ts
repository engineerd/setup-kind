import * as exec from '@actions/exec';
import process from 'process';

export function kindCommand(): string {
  return process.platform == 'win32' ? 'kind.exe' : 'kind';
}

export async function executeKindCommand(args: string[]) {
  const command = kindCommand();
  console.log(`Executing ${command} with args ` + args.join(' '));
  await exec.exec(command, args);
}
