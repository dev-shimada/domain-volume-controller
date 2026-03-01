/**
 * Service Worker (background script) for Domain Volume Controller
 */

import { MessageType, Message, MessageResponse } from '../shared/types';
import { getVolumeForDomain, setVolumeForDomain } from '../shared/storage';
import { extractDomain, normalizeDomain } from '../utils/domain';

/**
 * Handle messages from popup or content scripts
 */
chrome.runtime.onMessage.addListener((
  message: Message,
  sender,
  sendResponse: (response: MessageResponse) => void
) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Keep channel open for async response
});

/**
 * Process incoming messages
 */
async function handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<MessageResponse> {
  switch (message.type) {
    case MessageType.GET_VOLUME:
      return await handleGetVolume(message);

    case MessageType.SET_VOLUME:
      return await handleSetVolume(message, sender);

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Handle GET_VOLUME message
 */
async function handleGetVolume(message: Message): Promise<MessageResponse> {
  if (!message.domain) {
    return { success: false, error: 'Domain is required' };
  }

  try {
    const normalizedDomain = normalizeDomain(message.domain);
    const volume = await getVolumeForDomain(normalizedDomain);
    return { success: true, volume };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle SET_VOLUME message
 */
async function handleSetVolume(message: Message, sender: chrome.runtime.MessageSender): Promise<MessageResponse> {
  if (!message.domain) {
    return { success: false, error: 'Domain is required' };
  }

  if (message.volume === undefined) {
    return { success: false, error: 'Volume is required' };
  }

  try {
    const normalizedDomain = normalizeDomain(message.domain);
    await setVolumeForDomain(normalizedDomain, message.volume);

    // Notify content script on the same domain to apply the new volume
    if (sender.tab?.id) {
      await notifyTabToApplyVolume(sender.tab.id);
    }

    return { success: true, volume: message.volume };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send message to tab to apply volume
 */
async function notifyTabToApplyVolume(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'APPLY_VOLUME' });
  } catch (error) {
    // Tab might be closed or content script not loaded, ignore error
    console.debug('Could not notify tab:', error);
  }
}

/**
 * Handle tab updates to apply volume to new pages
 */
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  // When a page finishes loading, the content script will automatically apply volume
  // No action needed here, but we keep the listener for future enhancements
  if (changeInfo.status === 'complete' && tab.url) {
    const domain = extractDomain(tab.url);
    if (domain) {
      console.debug(`Page loaded on domain: ${domain}`);
    }
  }
});

console.log('Domain Volume Controller service worker initialized');
