/**
 * Chrome Storage operations for domain volumes
 */

import { STORAGE_KEY, VOLUME_MIN, VOLUME_MAX, VOLUME_DEFAULT } from './constants';
import { VolumeSettings } from './types';

/**
 * Get volume setting for a specific domain
 * @param domain - Normalized domain name
 * @returns Volume percentage (0-100), defaults to 100 if not set
 */
export async function getVolumeForDomain(domain: string): Promise<number> {
  if (!domain) {
    return VOLUME_DEFAULT;
  }

  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const volumes: VolumeSettings = result[STORAGE_KEY] || {};
    return volumes[domain] ?? VOLUME_DEFAULT;
  } catch (error) {
    console.error('Error getting volume for domain:', error);
    return VOLUME_DEFAULT;
  }
}

/**
 * Set volume for a specific domain
 * @param domain - Normalized domain name
 * @param volume - Volume percentage (0-100), will be clamped to valid range
 */
export async function setVolumeForDomain(domain: string, volume: number): Promise<void> {
  try {
    // Clamp volume to valid range
    const clampedVolume = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume));

    // Get existing volumes
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const volumes: VolumeSettings = result[STORAGE_KEY] || {};

    // Update volume for domain
    volumes[domain] = clampedVolume;

    // Save back to storage
    await chrome.storage.local.set({ [STORAGE_KEY]: volumes });
  } catch (error) {
    console.error('Error setting volume for domain:', error);
    throw error;
  }
}

/**
 * Get all domain volume settings
 * @returns Object mapping domains to volumes
 */
export async function getAllVolumes(): Promise<VolumeSettings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || {};
  } catch (error) {
    console.error('Error getting all volumes:', error);
    return {};
  }
}
