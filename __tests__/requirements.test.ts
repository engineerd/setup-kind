import { checkEnvironment } from '../src/requirements';

const testEnvVars = {
  INPUT_VERSION: 'v0.7.0',
  GITHUB_JOB: 'kind',
  GITHUB_WORKSPACE: '/home/runner/repo',
  RUNNER_OS: 'Linux',
  RUNNER_ARCH: 'X64',
  RUNNER_TEMP: '/home/runner/work/_temp',
  RUNNER_TOOL_CACHE: '/opt/hostedtoolcache',
};

describe('checking requirements', function () {
  const originalEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      ...testEnvVars,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('required GITHUB_JOB must be defined', async () => {
    process.env['GITHUB_JOB'] = '';
    await expect(checkEnvironment()).rejects.toThrow('Expected GITHUB_JOB to be defined');
  });
});
