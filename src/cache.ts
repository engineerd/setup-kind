import * as cache from '@actions/cache';
import * as core from '@actions/core';
import crypto from 'crypto';
import path from 'path';
import process from 'process';
import * as semver from 'semver';
import { KIND_TOOL_NAME, KUBECTL_TOOL_NAME } from './constants';

/**
 * Restores Kind and Kubectl from cache
 * @param version
 */
export async function restoreSetupKindCache(kind_version: string, kubernetes_version: string) {
  const primaryKey = setupKindPrimaryKey(kind_version, kubernetes_version);
  const paths = setupKindCachePaths(kind_version, kubernetes_version);

  core.debug(`Primary key is ${primaryKey}`);

  const matchedKey = await cache.restoreCache(paths, primaryKey);

  if (matchedKey) {
    core.info(`Cache setup-kind restored from key: ${matchedKey}`);
  } else {
    core.info('Cache setup-kind is not found');
  }
  return {
    paths,
    primaryKey,
  };
}
/**
 * Defines the cache paths
 * It is the folder where kind will be stored in the tool-cache
 * per it's version and process architecture
 * @param version
 * @returns the cache paths
 */
function setupKindCachePaths(kind_version: string, kubernetes_version: string) {
  const RUNNER_TOOL_CACHE = process.env['RUNNER_TOOL_CACHE'] || '';
  const paths = [
    path.join(RUNNER_TOOL_CACHE, KIND_TOOL_NAME, semver.clean(kind_version) || kind_version),
  ];
  if (kubernetes_version !== '') {
    paths.push(
      path.join(
        RUNNER_TOOL_CACHE,
        KUBECTL_TOOL_NAME,
        semver.clean(kubernetes_version) || kubernetes_version
      )
    );
  }
  return paths;
}

/**
 * Defines a primary Key for the kind cache.
 * It is the concatenation of the $RUNNER_OS, the $RUNNER_ARCH
 * and the hexadecimal value of the sha256 of the version
 * @param version
 * @returns the primary Key
 */
function setupKindPrimaryKey(kind_version: string, kubernetes_version: string) {
  const RUNNER_OS = process.env['RUNNER_OS'] || '';
  const RUNNER_ARCH = process.env['RUNNER_ARCH'] || '';
  const SETUP_KIND_CACHE_KEY_PREFIX = `${RUNNER_OS}-${RUNNER_ARCH}-setup-kind-`;
  const key = JSON.stringify({
    architecture: process.arch,
    kind: kind_version,
    kubernetes: kubernetes_version,
    platform: process.platform,
  });
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return `${SETUP_KIND_CACHE_KEY_PREFIX}${hash}`;
}

/**
 * Save Kind and Kubectl in the cache
 * @param primaryKey
 */
export async function saveSetupKindCache(paths: string[], primaryKey: string) {
  try {
    await cache.saveCache(paths, primaryKey);
    core.info(`Cache setup-kind saved with the key ${primaryKey}`);
  } catch (err) {
    const error = err as Error;
    if (error.name === cache.ValidationError.name) {
      throw error;
    } else if (error.name === cache.ReserveCacheError.name) {
      core.info(error.message);
    } else {
      core.warning(error.message);
    }
  }
}
