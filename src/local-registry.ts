import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as TOML from '@iarna/toml';
import * as yaml from 'js-yaml';
import path from 'path';
import { v5 as uuidv5 } from 'uuid';
import { Input, KIND_TOOL_NAME } from './constants';
import { ConfigPatch } from './containerd';
import * as kubectl from './kubectl';
import { Cluster, ConfigMap } from './kubernetes';
import { write } from './yaml-helper';

export const REGISTRY_NAME = 'kind-registry';
export const REGISTRY_HOST = 'localhost';
export const REGISTRY_PORT = '5000';
export const KIND_REGISTRY = `${REGISTRY_HOST}:${REGISTRY_PORT}`;
const REGISTRY_IMAGE = 'registry:2';

export async function initRegistrySetup() {
  if (core.getInput(Input.LocalRegistry) === 'true') {
    await createRegistryUnlessAlreadyExists();
    return createKindConfig();
  }
  return '';
}

async function createRegistryUnlessAlreadyExists() {
  if (!(await registryAlreadyExists())) {
    await createRegistry();
  }
  core.exportVariable('KIND_REGISTRY', KIND_REGISTRY);
}

async function connectRegistryToClusterNetwork() {
  await core.group(`Connect ${REGISTRY_NAME} to the kind network`, async () => {
    const args = ['network', 'connect', 'kind', REGISTRY_NAME];
    await exec.exec('docker', args);
  });
}

async function createRegistry() {
  await core.group(
    `Create ${REGISTRY_NAME} at ${KIND_REGISTRY} with ${REGISTRY_IMAGE}`,
    async () => {
      const args = [
        'run',
        '-d',
        '--restart',
        'always',
        '-p',
        `${REGISTRY_PORT}:5000`,
        '--name',
        REGISTRY_NAME,
        REGISTRY_IMAGE,
      ];
      await exec.exec('docker', args);
    }
  );
}

function createKindConfig() {
  if (core.getInput(Input.Config) === '') {
    const cluster: Cluster = {
      kind: 'Cluster',
      apiVersion: 'kind.x-k8s.io/v1alpha4',
      containerdConfigPatches: [
        `[plugins."io.containerd.grpc.v1.cri".registry.mirrors."${KIND_REGISTRY}"]
    endpoint = ["http://${REGISTRY_NAME}:5000"]`,
      ],
    };
    const dirs: string[] = [KIND_TOOL_NAME, core.getInput(Input.Name)];
    const dir = path.join(
      `${process.env['RUNNER_TEMP'] || ''}`,
      uuidv5(dirs.join('/'), uuidv5.URL)
    );
    return write(dir, 'kind-config.yaml', cluster);
  }
  return '';
}

async function registryAlreadyExists() {
  const args = ['inspect', '-f', "'{{.State.Running}}'", REGISTRY_NAME];
  const exitCode = await exec.exec('docker', args, {
    ignoreReturnCode: true,
    silent: true,
  });
  return exitCode === 0;
}

export async function finishRegistrySetup() {
  if (core.getInput(Input.LocalRegistry) === 'true') {
    await connectRegistryToClusterNetwork();
    await documentRegistry();
  }
}

async function documentRegistry() {
  await core.group(`Document ${REGISTRY_NAME}`, async () => {
    const configMap: ConfigMap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: 'local-registry-hosting',
        namespace: 'kube-public',
      },
      data: {
        'localRegistryHosting.v1': yaml.dump(
          {
            host: KIND_REGISTRY,
            help: 'https://kind.sigs.k8s.io/docs/user/local-registry/',
          },
          {
            quotingType: '"',
            forceQuotes: true,
          }
        ),
      },
    };
    await kubectl.applyConfigMap(configMap, 'local-registry-configmap.yaml');
  });
}

export function parseConfigPatch(configPatch: string) {
  return JSON.parse(JSON.stringify(TOML.parse(configPatch))) as ConfigPatch;
}

export function hasRegistryConfig(configPatch: string) {
  const config: ConfigPatch = parseConfigPatch(configPatch);
  return (
    config &&
    config.plugins &&
    config.plugins['io.containerd.grpc.v1.cri'] &&
    config.plugins['io.containerd.grpc.v1.cri'].registry &&
    config.plugins['io.containerd.grpc.v1.cri'].registry.mirrors &&
    config.plugins['io.containerd.grpc.v1.cri'].registry.mirrors[KIND_REGISTRY] &&
    config.plugins['io.containerd.grpc.v1.cri'].registry.mirrors[KIND_REGISTRY].endpoint &&
    config.plugins['io.containerd.grpc.v1.cri'].registry.mirrors[KIND_REGISTRY].endpoint.includes(
      `http://${REGISTRY_NAME}:5000`
    )
  );
}
