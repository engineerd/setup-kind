import { env as goenv } from '../src/go';

describe('checking go env simulation', function () {
  it('correctly parse os', () => {
    expect(['windows', 'darwin', 'linux']).toContain(goenv.GOOS);
  });

  it('correctly parse arch', () => {
    expect(['amd64', 'arm64']).toContain(goenv.GOARCH);
  });
});
