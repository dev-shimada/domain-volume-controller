/**
 * Content script for controlling media volume (runs in ISOLATED world).
 * Reads saved volume from storage and communicates with the
 * volume-enforcer (MAIN world) via CustomEvent.
 */

import { extractDomain, normalizeDomain } from '../utils/domain';
import { getVolumeForDomain } from '../shared/storage';
import { MEDIA_SELECTORS, OBSERVER_CONFIG, VOLUME_MIN, VOLUME_MAX } from '../shared/constants';

/**
 * Apply volume to a media element.
 * In the isolated world, this uses the original (non-overridden) setter.
 */
export function applyVolume(element: HTMLMediaElement, volumePercent: number): void {
  const clamped = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volumePercent));
  element.volume = clamped / 100;
}

/**
 * Find all media elements in the document or a specific container
 */
export function findMediaElements(container: Document | Element = document): HTMLMediaElement[] {
  return Array.from(container.querySelectorAll<HTMLMediaElement>(MEDIA_SELECTORS));
}

/**
 * Notify the main-world enforcer of the target volume via CustomEvent.
 * The enforcer will override page JS volume changes to enforce this value.
 */
function notifyEnforcer(volumePercent: number): void {
  window.dispatchEvent(
    new CustomEvent('__dvc_set_volume', { detail: { volume: volumePercent } })
  );
}

/**
 * Read saved volume from storage, notify the enforcer, and apply directly.
 */
async function applySavedVolume(): Promise<void> {
  try {
    const domain = extractDomain(window.location.href);
    const normalizedDomain = normalizeDomain(domain);
    const volume = await getVolumeForDomain(normalizedDomain);

    // Tell the main-world enforcer what volume to enforce
    notifyEnforcer(volume);

    // Also apply directly from isolated world (original setter)
    findMediaElements().forEach(el => applyVolume(el, volume));
  } catch (error) {
    console.error('[DVC] Error applying volume:', error);
  }
}

/**
 * Set up MutationObserver to watch for new media elements
 */
function observeNewElements(): void {
  const observer = new MutationObserver((mutations) => {
    let hasNewMedia = false;

    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          if (node.matches?.(MEDIA_SELECTORS) || node.querySelector?.(MEDIA_SELECTORS)) {
            hasNewMedia = true;
            break;
          }
        }
      }
      if (hasNewMedia) break;
    }

    if (hasNewMedia) {
      applySavedVolume();
    }
  });

  observer.observe(document.body, OBSERVER_CONFIG);
}

/**
 * Listen for volume change messages from the popup
 */
function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'APPLY_VOLUME') {
      applySavedVolume().then(() => {
        sendResponse({ success: true });
      }).catch(() => {
        sendResponse({ success: false });
      });
      return true; // Keep channel open for async response
    }
    return false;
  });
}

/**
 * Initialize content script
 */
function init(): void {
  // Read volume from storage and notify enforcer as soon as possible
  applySavedVolume();

  // Listen for messages from popup
  setupMessageListener();

  // When body is available, start observing for new media elements
  if (document.body) {
    observeNewElements();
  } else {
    // At document_start, body may not exist yet
    const bodyObserver = new MutationObserver(() => {
      if (document.body) {
        bodyObserver.disconnect();
        observeNewElements();
        applySavedVolume();
      }
    });
    bodyObserver.observe(document.documentElement, { childList: true });
  }

  // Reapply when page fully loads (catches late-loading media)
  window.addEventListener('load', () => applySavedVolume());
}

// Run immediately at document_start — don't wait for DOMContentLoaded
init();
