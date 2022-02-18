import * as core from '@actions/core';
import * as exec from '@actions/exec';
import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';
import { v5 as uuidv5 } from 'uuid';
import { Input, KIND_TOOL_NAME, KUBECTL_COMMAND } from './constants';

async function executeKubectlCommand(args: string[]) {
  await exec.exec(KUBECTL_COMMAND, args);
}

async function kubectlApply(file: string) {
  const args: string[] = ['apply', '-f', file];
  await executeKubectlCommand(args);
}

const METALLB_DEFAULT_VERSION = 'v0.12.1';

async function createMemberlistSecrets() {
  await core.group('Create the memberlist secrets', async () => {
    const args: string[] = [
      'create',
      'secret',
      'generic',
      '-n',
      'metallb-system',
      'memberlist',
      '--from-literal=secretkey="$(openssl rand -base64 128)"',
    ];
    await executeKubectlCommand(args);
  });
}

async function createMetallbNamespace() {
  await core.group('Create the metallb namespace', async () => {
    await kubectlApply(
      `https://raw.githubusercontent.com/metallb/metallb/${METALLB_DEFAULT_VERSION}/manifests/namespace.yaml`
    );
  });
}

async function applyMetallbManifest() {
  await core.group('Apply metallb manifest', async () => {
    await kubectlApply(
      `https://raw.githubusercontent.com/metallb/metallb/${METALLB_DEFAULT_VERSION}/manifests/metallb.yaml`
    );
  });
}

export async function setUpLoadBalancer() {
  if (hasLoadBalancer()) {
    await createMetallbNamespace();
    await createMemberlistSecrets();
    await applyMetallbManifest();
    await waitForMetallbPods();
    await setupAddressPool();
  }
}

async function waitForMetallbPods() {
  await core.group('Wait for metallb pods to have a status of Running', async () => {
    const args: string[] = [
      'wait',
      '-n',
      'metallb-system',
      'pod',
      '--all',
      '--for=condition=ready',
      '--timeout=240s',
    ];
    await executeKubectlCommand(args);
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

    const addressPool = {
      'address-pools': [
        {
          name: 'default',
          protocol: 'layer2',
          addresses: [`${first}.${second}.255.200-${first}.${second}.255.250`],
        },
      ],
    };

    const configMap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        namespace: 'metallb-system',
        name: 'config',
      },
      data: {
        config: yaml.dump(addressPool),
      },
    };
    const dirs: string[] = [KIND_TOOL_NAME, core.getInput(Input.Name), 'load-balancer'];
    const dir = path.join(
      `${process.env['RUNNER_TEMP'] || ''}`,
      uuidv5(dirs.join('/'), uuidv5.URL)
    );
    const file = path.join(dir, 'metallb-configmap.yaml');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = yaml.dump(configMap);
    core.debug(`Dumping into ${file}: \n${data}`);
    fs.writeFileSync(file, data, 'utf8');
    await kubectlApply(file);
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
