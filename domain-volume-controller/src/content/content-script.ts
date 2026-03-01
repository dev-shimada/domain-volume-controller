/**
 * Content script for controlling media volume
 */

import { extractDomain, normalizeDomain } from '../utils/domain';
import { getVolumeForDomain } from '../shared/storage';
import { MEDIA_SELECTORS, OBSERVER_CONFIG, VOLUME_MIN, VOLUME_MAX } from '../shared/constants';

/**
 * Apply volume to a media element
 * @param element - Audio or video element
 * @param volumePercent - Volume as percentage (0-100)
 */
export function applyVolume(element: HTMLMediaElement, volumePercent: number): void {
  // Clamp to valid range
  const clamped = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volumePercent));
  // Convert percentage to 0.0-1.0 range
  element.volume = clamped / 100;
}

/**
 * Find all media elements in the document or a specific container
 * @param container - Optional container to search in, defaults to document
 * @returns Array of media elements
 */
export function findMediaElements(container: Document | Element = document): HTMLMediaElement[] {
  return Array.from(container.querySelectorAll<HTMLMediaElement>(MEDIA_SELECTORS));
}

/**
 * Apply volume to all media elements on the page
 */
async function applyVolumeToAll(): Promise<void> {
  try {
    const domain = extractDomain(window.location.href);
    const normalizedDomain = normalizeDomain(domain);
    const volume = await getVolumeForDomain(normalizedDomain);

    const elements = findMediaElements();
    elements.forEach(element => applyVolume(element, volume));
  } catch (error) {
    console.error('Error applying volume:', error);
  }
}

/**
 * Set up MutationObserver to watch for new media elements
 */
function observeNewElements(): void {
  const observer = new MutationObserver((mutations) => {
    let hasNewMedia = false;

    for (const mutation of mutations) {
      const nodesArray = Array.from(mutation.addedNodes);
      for (const node of nodesArray) {
        if (node instanceof HTMLElement) {
          // Check if the added node is a media element
          if (node.matches(MEDIA_SELECTORS)) {
            hasNewMedia = true;
            break;
          }
          // Check if the added node contains media elements
          if (node.querySelector(MEDIA_SELECTORS)) {
            hasNewMedia = true;
            break;
          }
        }
      }
      if (hasNewMedia) break;
    }

    if (hasNewMedia) {
      applyVolumeToAll();
    }
  });

  observer.observe(document.body, OBSERVER_CONFIG);
}

/**
 * Listen for volume change messages
 */
function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'APPLY_VOLUME') {
      applyVolumeToAll().then(() => {
        sendResponse({ success: true });
      });
      return true; // Keep channel open for async response
    }
    return false; // Don't keep channel open for other message types
  });
}

/**
 * Initialize content script
 */
function init(): void {
  // Apply volume to existing elements
  applyVolumeToAll();

  // Watch for new elements
  observeNewElements();

  // Listen for messages
  setupMessageListener();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
