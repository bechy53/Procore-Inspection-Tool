/**
 * Chrome messaging utilities for cross-context communication
 * @module utils/messageUtils
 */

/**
 * Sends a message to the active tab
 * @param {Object} message - Message object to send
 * @returns {Promise<any>} Response from the tab
 */
export async function sendMessageToActiveTab(message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        reject(new Error('No active tab found'));
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  });
}

/**
 * Sends a message to a specific tab
 * @param {number} tabId - ID of the tab to send message to
 * @param {Object} message - Message object to send
 * @returns {Promise<any>} Response from the tab
 */
export async function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Sends a message to the background service worker
 * @param {Object} message - Message object to send
 * @returns {Promise<any>} Response from background
 */
export async function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Gets the active tab
 * @returns {Promise<chrome.tabs.Tab>} The active tab
 */
export async function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        reject(new Error('No active tab found'));
      } else {
        resolve(tabs[0]);
      }
    });
  });
}

/**
 * Checks if an error is a connection error (tab closed, page refreshed, etc.)
 * @param {Error} error - The error to check
 * @returns {boolean} True if it's a connection error
 */
export function isConnectionError(error) {
  const message = error.message || '';
  return message.includes('Receiving end does not exist') ||
         message.includes('message port closed') ||
         message.includes('Extension context invalidated') ||
         message.includes('No tab with id');
}

/**
 * Updates progress in the UI via message
 * @param {string} text - Progress text
 * @param {number} percent - Progress percentage (0-100)
 * @param {boolean} complete - Whether operation is complete
 * @returns {void}
 */
export function sendProgressUpdate(text, percent, complete = false) {
  chrome.runtime.sendMessage({
    action: 'fillProgress',
    text,
    percent: Math.min(percent, complete ? 100 : 95)
  });
}
