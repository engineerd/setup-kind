import os from 'os';
import path from 'path';
import { KindPostService } from '../../src/kind/post';

const testEnvVars = {
  INPUT_VERBOSITY: '3',
  INPUT_QUIET: 'true',
  INPUT_NAME: 'some-name',
  INPUT_KUBECONFIG: 'some-kubeconfig-path',
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
    const service: KindPostService = KindPostService.getInstance();
    expect(service.kubeConfigFile).toEqual(testEnvVars.INPUT_KUBECONFIG);
    expect(service.skipClusterDeletion).toEqual(false);
    expect(service.skipClusterLogsExport).toEqual(false);
  });

  it('correctly set skipClusterDeletion', () => {
    process.env['INPUT_SKIPCLUSTERDELETION'] = 'true';
    const service: KindPostService = KindPostService.getInstance();
    expect(service.skipClusterDeletion).toEqual(true);
  });

  it('correctly generates the cluster delete command', () => {
    const args: string[] = KindPostService.getInstance().deleteCommand();
    expect(args).toEqual([
      'delete',
      'cluster',
      '--verbosity',
      testEnvVars.INPUT_VERBOSITY,
      '--quiet',
      testEnvVars.INPUT_QUIET,
      '--name',
      testEnvVars.INPUT_NAME,
      '--kubeconfig',
      testEnvVars.INPUT_KUBECONFIG,
    ]);
  });

  it('correctly generates the cluster export logs command', () => {
    const args: string[] = KindPostService.getInstance().exportLogsCommand();
    expect(args).toEqual([
      'export',
      'logs',
      path.join(os.tmpdir(), 'kind/some-name/logs'),
      '--verbosity',
      testEnvVars.INPUT_VERBOSITY,
      '--quiet',
      testEnvVars.INPUT_QUIET,
      '--name',
      testEnvVars.INPUT_NAME,
    ]);
  });
});
