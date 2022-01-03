import * as go from '../src/go';

describe('checking go env simulation', function () {
  it('correctly parse os', () => {
    expect(['windows', 'darwin', 'linux']).toContain(go.goos());
  });

  it('correctly parse arch', () => {
    expect(['amd64', 'arm64']).toContain(go.goarch());
  });
});
