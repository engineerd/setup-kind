import path from 'path';
import { KindMainService } from '../src/kind-main';

const testEnvVars = {
  INPUT_VERBOSITY: '3',
  INPUT_QUIET: 'true',
  INPUT_VERSION: 'v0.5.3',
  INPUT_CONFIG: 'some-path',
  INPUT_IMAGE: 'some-docker-image',
  INPUT_NAME: 'some-name',
  INPUT_WAIT: '123s',
  INPUT_KUBECONFIG: 'some-kubeconfig-path',
  INPUT_SKIPCLUSTERCREATION: 'false',
  GITHUB_WORKSPACE: '/home/runner/repo',
};

describe('checking input parsing', function () {
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

  it('correctly parse input', () => {
    const service: KindMainService = KindMainService.getInstance();
    expect(service.version).toEqual(testEnvVars.INPUT_VERSION);
    expect(service.configFile).toEqual(testEnvVars.INPUT_CONFIG);
    expect(service.image).toEqual(testEnvVars.INPUT_IMAGE);
    expect(service.name).toEqual(testEnvVars.INPUT_NAME);
    expect(service.waitDuration).toEqual(testEnvVars.INPUT_WAIT);
    expect(service.kubeConfigFile).toEqual(testEnvVars.INPUT_KUBECONFIG);
    expect(service.skipClusterCreation).toEqual(false);
  });

  it('correctly set skipClusterCreation', () => {
    process.env['INPUT_SKIPCLUSTERCREATION'] = 'true';
    const service: KindMainService = KindMainService.getInstance();
    expect(service.skipClusterCreation).toEqual(true);
  });

  it('correctly generates the cluster create command', () => {
    const args: string[] = KindMainService.getInstance().createCommand();
    expect(args).toEqual([
      'create',
      'cluster',
      '--verbosity',
      testEnvVars.INPUT_VERBOSITY,
      '--quiet',
      testEnvVars.INPUT_QUIET,
      '--config',
      path.normalize('/home/runner/repo/some-path'),
      '--image',
      testEnvVars.INPUT_IMAGE,
      '--name',
      testEnvVars.INPUT_NAME,
      '--wait',
      testEnvVars.INPUT_WAIT,
      '--kubeconfig',
      testEnvVars.INPUT_KUBECONFIG,
    ]);
  });
});
