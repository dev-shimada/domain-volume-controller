/**
 * Constants for Domain Volume Controller
 */

export const VOLUME_MIN = 0;
export const VOLUME_MAX = 100;
export const VOLUME_DEFAULT = 100;
export const STORAGE_KEY = 'domainVolumes';

/**
 * Media element selectors
 */
export const MEDIA_SELECTORS = 'audio, video';

/**
 * MutationObserver configuration
 */
export const OBSERVER_CONFIG: MutationObserverInit = {
  childList: true,
  subtree: true,
};
