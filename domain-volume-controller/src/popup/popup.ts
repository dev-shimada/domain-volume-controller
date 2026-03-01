/**
 * Popup script for Domain Volume Controller
 */

import { extractDomain, normalizeDomain } from '../utils/domain';
import { getVolumeForDomain, setVolumeForDomain } from '../shared/storage';

// DOM elements
let volumeSlider: HTMLInputElement;
let volumeValue: HTMLElement;
let domainDisplay: HTMLElement;
let currentDomain: string = '';

/**
 * Get the domain of the current active tab
 */
async function getCurrentTabDomain(): Promise<string> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url) {
      return extractDomain(tabs[0].url);
    }
  } catch (error) {
    console.error('Error getting current tab:', error);
  }
  return '';
}

/**
 * Update the UI with the current domain and volume
 */
async function updateUI(): Promise<void> {
  try {
    currentDomain = await getCurrentTabDomain();

    if (!currentDomain) {
      domainDisplay.textContent = 'No domain detected';
      volumeSlider.disabled = true;
      return;
    }

    const normalizedDomain = normalizeDomain(currentDomain);
    domainDisplay.textContent = normalizedDomain;

    const volume = await getVolumeForDomain(normalizedDomain);
    volumeSlider.value = volume.toString();
    volumeValue.textContent = `${volume}%`;
    volumeSlider.disabled = false;
  } catch (error) {
    console.error('Error updating UI:', error);
    domainDisplay.textContent = 'Error loading domain';
    volumeSlider.disabled = true;
  }
}

/**
 * Handle volume slider change
 */
async function handleVolumeChange(): Promise<void> {
  try {
    const volume = parseInt(volumeSlider.value, 10);
    volumeValue.textContent = `${volume}%`;

    if (currentDomain) {
      const normalizedDomain = normalizeDomain(currentDomain);
      await setVolumeForDomain(normalizedDomain, volume);

      // Notify the content script to apply the new volume
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'APPLY_VOLUME' }).catch(() => {
          // Content script might not be loaded yet, ignore error
        });
      }
    }
  } catch (error) {
    console.error('Error saving volume:', error);
  }
}

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  // Get DOM elements
  volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
  volumeValue = document.getElementById('volumeValue') as HTMLElement;
  domainDisplay = document.getElementById('domainDisplay') as HTMLElement;

  // Set up event listeners
  volumeSlider.addEventListener('input', handleVolumeChange);

  // Update UI with current domain and volume
  await updateUI();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
