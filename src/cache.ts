import * as cache from '@actions/cache';
import * as core from '@actions/core';
import crypto from 'crypto';
import path from 'path';
import process from 'process';
import { KIND_TOOL_NAME } from './constants';

const KIND_CACHE_PATHS = [
  path.join(`${process.env['RUNNER_TOOL_CACHE']}`, KIND_TOOL_NAME),
];

const KIND_CACHE_KEY_PREFIX = `${process.env['RUNNER_OS']}-${process.env['RUNNER_ARCH']}-setup-kind-`;

/**
 * Restores Kind by version, $RUNNER_OS and $RUNNER_ARCH
 * @param version
 */
export async function restoreKindCache(version: string) {
  const primaryKey = kindPrimaryKey(version);

  core.debug(`Primary key is ${primaryKey}`);

  const matchedKey = await cache.restoreCache(KIND_CACHE_PATHS, primaryKey);

  if (matchedKey) {
    core.info(`Cache setup-kind restored from key: ${matchedKey}`);
  } else {
    core.info('Cache setup-kind is not found');
  }
  return primaryKey;
}
/**
 * Defines a primary Key for the kind cache.
 * It is the concatenation of the $RUNNER_OS, the $RUNNER_ARCH and the hexadecimal value of the sha256 of the version
 * @param version
 * @returns the primary Key
 */
function kindPrimaryKey(version: string) {
  const hash = crypto.createHash('sha256').update(version).digest('hex');
  return `${KIND_CACHE_KEY_PREFIX}${hash}`;
}

/**
 * Caches Kind by it's primaryKey
 * @param primaryKey
 */
export async function saveKindCache(primaryKey: string) {
  try {
    await cache.saveCache(KIND_CACHE_PATHS, primaryKey);
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
