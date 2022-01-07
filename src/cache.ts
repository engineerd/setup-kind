import * as cache from '@actions/cache';
import * as core from '@actions/core';
import crypto from 'crypto';
import path from 'path';
import process from 'process';
import * as semver from 'semver';
import { KIND_TOOL_NAME } from './constants';

/**
 *  Prefix of the kind cache key
 */
const KIND_CACHE_KEY_PREFIX = `${process.env['RUNNER_OS']}-${process.env['RUNNER_ARCH']}-setup-kind-`;

/**
 * Parameters used by the cache to save and restore
 */
export interface CacheParameters {
  /**
   * a list of file paths to restore from the cache
   */
  paths: string[];
  /**
   * An explicit key for restoring the cache
   */
  primaryKey: string;
}

/**
 * Restores Kind by version, $RUNNER_OS and $RUNNER_ARCH
 * @param version
 */
export async function restoreKindCache(
  version: string
): Promise<CacheParameters> {
  const primaryKey = kindPrimaryKey(version);
  const cachePaths = kindCachePaths(version);

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
function kindCachePaths(version: string) {
  return [
    path.join(
      `${process.env['RUNNER_TOOL_CACHE']}`,
      KIND_TOOL_NAME,
      semver.clean(version) || version
    ),
  ];
}

/**
 * Defines a primary Key for the kind cache.
 * It is the concatenation of the $RUNNER_OS, the $RUNNER_ARCH
 * and the hexadecimal value of the sha256 of the version
 * @param version
 * @returns the primary Key
 */
function kindPrimaryKey(version: string) {
  const hash = crypto
    .createHash('sha256')
    .update(`kind-${version}-${process.platform}-${process.arch}-`)
    .digest('hex');
  return `${KIND_CACHE_KEY_PREFIX}${hash}`;
}

/**
 * Caches Kind by it's primaryKey
 * @param primaryKey
 */
export async function saveKindCache(parameters: CacheParameters) {
  try {
    await cache.saveCache(parameters.paths, parameters.primaryKey);
    core.info(`Cache setup-kind saved with the key ${parameters.primaryKey}`);
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
