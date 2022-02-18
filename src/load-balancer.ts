import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as yaml from 'js-yaml';
import { Input } from './constants';
import * as kubectl from './kubectl';
import { ConfigMap } from './kubernetes';

const METALLB_DEFAULT_VERSION = 'v0.12.1';

const METALLB_SYSTEM = 'metallb-system';

async function createMemberlistSecrets() {
  await core.group('Create the memberlist secrets', async () => {
    await kubectl.createMemberlistSecret(METALLB_SYSTEM);
  });
}

async function createNamespace(version: string) {
  await core.group(`Create the metallb@${version} namespace`, async () => {
    await kubectl.apply(
      `https://raw.githubusercontent.com/metallb/metallb/${version}/manifests/namespace.yaml`
    );
  });
}

async function applyManifest(version: string) {
  await core.group(`Apply metallb@${version} manifest`, async () => {
    await kubectl.apply(
      `https://raw.githubusercontent.com/metallb/metallb/${version}/manifests/metallb.yaml`
    );
  });
}

export async function setUpLoadBalancer() {
  if (hasLoadBalancer()) {
    const version = METALLB_DEFAULT_VERSION;
    await createNamespace(version);
    await createMemberlistSecrets();
    await applyManifest(version);
    await waitForPods();
    await setupAddressPool();
  }
}

async function waitForPods() {
  await core.group('Wait for metallb pods to have a status of Running', async () => {
    await kubectl.waitForPodReady(METALLB_SYSTEM);
  });
}

async function getIPBytes() {
  const args: string[] = [
    'network',
    'inspect',
    '-f',
    "'{{(index .IPAM.Config 0).Subnet}}'",
    'kind',
  ];
  const { stdout } = await exec.getExecOutput('docker', args, { silent: true });
  const bytes = stdout.replace(/'/g, '').split('.');
  return {
    first: bytes[0],
    second: bytes[1],
  };
}

export async function setupAddressPool() {
  await core.group('Setup address pool used by load-balancers', async () => {
    const { first, second } = await getIPBytes();
    const configMap: ConfigMap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        namespace: METALLB_SYSTEM,
        name: 'config',
      },
      data: {
        config: yaml.dump({
          'address-pools': [
            {
              name: 'default',
              protocol: 'layer2',
              addresses: [`${first}.${second}.255.200-${first}.${second}.255.250`],
            },
          ],
        }),
      },
    };
    await kubectl.applyConfigMap(configMap, 'metallb-configmap.yaml');
  });
}

function hasLoadBalancer() {
  if (core.getInput(Input.LoadBalancer) == 'true') {
    if (core.getInput(Input.SkipClusterCreation) == 'true') {
      core.warning(
        "The load-balancer requires the cluster to exists. It's configuration will be skipped"
      );
      return false;
    }
    return true;
  }
  return false;
}
