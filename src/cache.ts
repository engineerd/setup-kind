import * as cache from '@actions/cache';
import * as core from '@actions/core';
import crypto from 'crypto';
import path from 'path';
import process from 'process';
import * as semver from 'semver';
import { KIND_TOOL_NAME, KUBECTL_TOOL_NAME } from './constants';

/**
 *  Prefix of the kind cache key
 */
const KIND_CACHE_KEY_PREFIX = `${process.env['RUNNER_OS'] || ''}-${
  process.env['RUNNER_ARCH'] || ''
}-setup-kind-`;

/**
 * Restores Kind by version, $RUNNER_OS and $RUNNER_ARCH
 * @param version
 */
export async function restoreSetupKindCache(
  kind_version: string,
  kubectl_version: string
) {
  const primaryKey = setupKindPrimaryKey(kind_version, kubectl_version);
  const cachePaths = setupKindCachePaths(kind_version, kubectl_version);

  core.debug(`Primary key is ${primaryKey}`);

  const matchedKey = await cache.restoreCache(cachePaths, primaryKey);

  if (matchedKey) {
    core.info(`Cache setup-kind restored from key: ${matchedKey}`);
  } else {
    core.info('Cache setup-kind is not found');
  }
  return {
    paths: cachePaths,
    primaryKey: primaryKey,
  };
}
/**
 * Defines the cache paths
 * It is the folder where kind will be stored in the tool-cache
 * per it's version and process architecture
 * @param version
 * @returns the cache paths
 */
function setupKindCachePaths(kind_version: string, kubectl_version: string) {
  const paths = [
    path.join(
      `${process.env['RUNNER_TOOL_CACHE'] || ''}`,
      KIND_TOOL_NAME,
      semver.clean(kind_version) || kind_version
    ),
  ];
  if (kubectl_version !== '') {
    paths.push(
      path.join(
        `${process.env['RUNNER_TOOL_CACHE'] || ''}`,
        KUBECTL_TOOL_NAME,
        semver.clean(kubectl_version) || kubectl_version
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
function setupKindPrimaryKey(kind_version: string, kubectl_version: string) {
  const key = JSON.stringify({
    architecture: process.arch,
    kind: kind_version,
    kubectl: kubectl_version,
    platform: process.platform,
  });
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return `${KIND_CACHE_KEY_PREFIX}${hash}`;
}

/**
 * Caches Kind by it's primaryKey
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
