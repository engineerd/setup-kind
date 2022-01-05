import os from 'os';
import process from 'process';

/**
 * Simulate the calculation of the goos
 * @returns go env GOOS
 */
export function goos(): string {
  return process.platform == 'win32' ? 'windows' : process.platform;
}

/**
 * Simulate the calculation of the goarch
 * Based on https://nodejs.org/api/process.html#processarch
 * @returns go env GOARCH
 */
export function goarch(): string {
  const architecture = process.arch;
  switch (architecture) {
    case 'x64':
      return 'amd64';
    case 'arm':
      if (os.endianness().toLowerCase() === 'be') {
        return 'armbe';
      }
      return architecture;
    case 'arm64':
      if (os.endianness().toLowerCase() === 'be') {
        return 'arm64be';
      }
      return architecture;
    case 'ppc64':
      if (os.endianness().toLowerCase() === 'le') {
        return 'ppc64le';
      }
      return architecture;
    default:
      return architecture;
  }
}
