import os from 'os';
import process from 'process';

/**
 * Simulate the calculation of the goos
 * @returns go env GOOS
 */
function _goos(platform: string): string {
  switch (platform) {
    case 'sunos':
      return 'solaris';
    case 'win32':
      return 'windows';
    default:
      return platform;
  }
}

/**
 * Simulate the calculation of the goarch
 * Based on https://nodejs.org/api/process.html#processarch
 * @returns go env GOARCH
 */
function _goarch(architecture: string, endianness: string): string {
  switch (architecture) {
    case 'ia32':
      return '386';
    case 'x32':
      return 'amd';
    case 'x64':
      return 'amd64';
    case 'arm':
      return _withEndiannessOrDefault(architecture, endianness, 'be');
    case 'arm64':
      return _withEndiannessOrDefault(architecture, endianness, 'be');
    case 'mips':
      return _withEndiannessOrDefault(architecture, endianness, 'le');
    case 'ppc64':
      return _withEndiannessOrDefault(architecture, endianness, 'le');
    default:
      return architecture;
  }
}

function _withEndiannessOrDefault(
  architecture: string,
  endianness: string,
  suffix: string
): string {
  return endianness === suffix ? architecture + suffix : architecture;
}

export const env = {
  GOARCH: _goarch(process.arch, os.endianness().toLowerCase()),
  GOOS: _goos(process.platform),
};
