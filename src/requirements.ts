import * as core from '@actions/core';
import * as github from '@actions/github';
import * as io from '@actions/io';
import { ok } from 'assert';
import path from 'path';
import * as semver from 'semver';
import { Input, KIND_DEFAULT_VERSION } from './constants';
import { env as goenv } from './go';
import { Cluster } from './kubernetes';
import { hasRegistryConfig, KIND_REGISTRY, REGISTRY_NAME } from './local-registry';
import { read } from './yaml-helper';

export async function checkEnvironment() {
  checkVariables();
  await checkDocker();
  const { platform, kind } = await checkPlatform();
  const kubernetes = await getKubernetes(platform, kind.version);
  checkKindConfig();
  return {
    kind,
    kubernetes,
  };
}

async function getKubernetes(platform: string, kind_version: string) {
  const image = core.getInput(Input.Image);
  checkImageForVersion(image, kind_version);
  let version = parseKubernetesVersion(image);
  let url = '';

  if (version === '') {
    const kindConfig = core.getInput(Input.Config);
    if (kindConfig !== '') {
      version = parseKubernetesVersionFromConfig(kindConfig, kind_version);
    }
  }

  if (version !== '') {
    await checkKubernetesVersion(version);
    url = `https://storage.googleapis.com/kubernetes-release/release/${version}/bin/${platform}`;
  }
  return {
    version,
    url,
  };
}

function parseKubernetesVersionFromConfig(kindConfig: string, kind_version: string) {
  let version = '';
  const doc = parseKindConfig(kindConfig);
  if (doc.nodes) {
    const versions: string[] = doc.nodes
      .map((node) => {
        const image = node.image || '';
        checkImageForVersion(image, kind_version, { file: kindConfig });
        return parseKubernetesVersion(image);
      })
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort()
      .reverse();
    if (versions.length >= 1) {
      version = versions[0];
      if (versions.length > 1) {
        core.warning(
          `There are multiple versions of Kubernetes, ${version} will be used to configure kubectl`,
          { file: kindConfig }
        );
      }
    }
  }
  return version;
}

function parseKindConfig(kindConfig: string) {
  const kindConfigPath = path.join(`${process.env['GITHUB_WORKSPACE'] || ''}`, kindConfig);
  const doc = read(kindConfigPath) as Cluster;
  ok(doc.kind === 'Cluster', `The config file ${kindConfig} must be of kind Cluster`);
  return doc;
}

function parseKubernetesVersion(image: string) {
  let version = '';
  if (image && image.startsWith('kindest/node')) {
    version = image.split('@')[0].split(':')[1];
  }
  return version;
}

function getOctokit() {
  const token = core.getInput(Input.Token, { required: true });
  return github.getOctokit(token, {
    userAgent: 'engineerd/setup-kind',
  });
}

async function checkKubernetesVersion(version: string) {
  const octokit = getOctokit();
  const KUBERNETES = 'kubernetes';
  const { status } = await octokit.rest.repos.getReleaseByTag({
    owner: KUBERNETES,
    repo: KUBERNETES,
    tag: version,
  });
  ok(status === 200, `Kubernetes ${version} doesn't exists`);
}

/**
 * Check that the platform allows KinD installation with engineerd/setup-kind
 * @returns
 */
async function checkPlatform() {
  const platform = `${goenv.GOOS}/${goenv.GOARCH}`;
  const kind = await ensureKindSupportsPlatform(platform);
  ensureSetupKindSupportsPlatform(platform);
  return {
    platform,
    kind,
  };
}

/**
 * Check that  KinD supports the actual platform
 */
async function ensureKindSupportsPlatform(platform: string) {
  const { platforms, version } = await findVersionAndSupportedPlatforms();
  ok(
    platforms[platform],
    `sigs.k8s.io/kind@${version} doesn't support platform ${platform} but ${Object.getOwnPropertyNames(
      platforms
    )
      .sort()
      .join(' and ')}`
  );
  return {
    version: version,
    url: platforms[platform],
  };
}

/**
 * Finds supported platforms by version by calling api.github.com
 * @param inputVersion
 * @returns
 */
async function getReleaseByInputVersion(inputVersion: string) {
  const octokit = getOctokit();
  const KUBERNETES_SIGS = 'kubernetes-sigs';
  const KIND = 'kind';
  if (inputVersion === 'latest') {
    const { data } = await octokit.rest.repos.getLatestRelease({
      owner: KUBERNETES_SIGS,
      repo: KIND,
    });
    return {
      assets: data.assets,
      version: data.tag_name,
    };
  } else {
    checkVersion(inputVersion);
    const { data } = await octokit.rest.repos.getReleaseByTag({
      owner: KUBERNETES_SIGS,
      repo: KIND,
      tag: inputVersion,
    });
    return {
      assets: data.assets,
      version: data.tag_name,
    };
  }
}

/**
 * Finds supported platforms by version by calling api.github.com
 * @returns
 */
async function findVersionAndSupportedPlatforms() {
  const inputVersion = core.getInput(Input.Version, { required: true });
  const { assets, version } = await getReleaseByInputVersion(inputVersion);
  const platforms = assets.reduce(
    (total: { [key: string]: string }, asset: { name: string; browser_download_url: string }) => {
      const parts = asset.name.split('-');
      total[`${parts[1]}/${parts[2]}`] = asset.browser_download_url;
      return total;
    },
    {}
  );
  return { platforms, version };
}

/**
 * Check actually supported platforms by engineerd/setup-kind
 * @param platform
 */
function ensureSetupKindSupportsPlatform(platform: string) {
  const platforms: string[] = ['linux/amd64', 'linux/arm64'];
  if (!platforms.includes(platform)) {
    core.warning(
      `engineerd/setup-kind doesn't support platform ${platform} but ${platforms.join(' and ')}`
    );
  }
}

/**
 * Check required variables
 */
function checkVariables() {
  [
    'GITHUB_JOB',
    'GITHUB_WORKSPACE',
    'RUNNER_ARCH',
    'RUNNER_OS',
    'RUNNER_TEMP',
    'RUNNER_TOOL_CACHE',
  ].forEach((variable) => {
    ok(process.env[variable] || '', `Expected ${variable} to be defined`);
  });
}

/**
 * Check that Docker is installed on the server
 */
async function checkDocker() {
  const docker = await io.which('docker', false);
  ok(docker, 'Docker is required for kind use');
}

/**
 * Verify that the version of kind is a valid semver and prints a warning if the kind version used is older than the default for setup-kind
 */
function checkVersion(version: string) {
  ok(
    semver.clean(version),
    `Input ${Input.Version} expects a valid version like ${KIND_DEFAULT_VERSION}`
  );
  if (semver.lt(version, KIND_DEFAULT_VERSION)) {
    core.warning(
      `sigs.k8s.io/kind@${KIND_DEFAULT_VERSION} is available, have you considered using it ? See https://github.com/kubernetes-sigs/kind/releases/tag/${KIND_DEFAULT_VERSION}`
    );
  }
}

/**
 * Prints a warning if a kindest/node is used without sha256.
 * This follows the recommendation from https://kind.sigs.k8s.io/docs/user/working-offline/#using-a-prebuilt-node-imagenode-image
 */
function checkImageForVersion(
  image: string,
  kind_version: string,
  annotationProperties: core.AnnotationProperties = {}
) {
  if (image && image.startsWith('kindest/node') && !image.includes('@sha256:')) {
    core.warning(
      `Please include the @sha256: image digest for ${image} from the image in the release notes. You can find available image tags on the release page, https://github.com/kubernetes-sigs/kind/releases/tag/${kind_version}`,
      annotationProperties
    );
  }
}

/**
 * Prints a warning if the local registry configuration is missing in the kind config file
 */
function checkKindConfig() {
  const kindConfigFile = core.getInput(Input.Config);
  if (core.getInput(Input.LocalRegistry) === 'true' && kindConfigFile !== '') {
    const kindConfig = parseKindConfig(kindConfigFile);
    if (
      !kindConfig.containerdConfigPatches ||
      !kindConfig.containerdConfigPatches.find((value) => hasRegistryConfig(value))
    ) {
      core.warning(
        `Please provide the following configuration in containerdConfigPatches:
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."${KIND_REGISTRY}"]
           endpoint = ["https://${REGISTRY_NAME}:5000"]`,
        { file: kindConfigFile }
      );
    }
  }
}
