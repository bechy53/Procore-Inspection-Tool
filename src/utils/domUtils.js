/**
 * DOM manipulation utilities
 * @module utils/domUtils
 */

/**
 * Waits for an element to appear in the DOM
 * @param {string} selector - CSS selector for the element
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<Element>} The found element
 * @throws {Error} If element is not found within timeout
 */
export async function waitForElement(selector, timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await sleep(100);
  }
  
  throw new Error(`Element ${selector} not found after ${timeout}ms`);
}

/**
 * Utility to sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Finds the largest scrollable container in the document
 * @returns {Element|null} The scrollable element or null
 */
export function findScrollableContainer() {
  let scrollElement = null;
  let maxScrollHeight = 0;
  
  document.querySelectorAll('*').forEach(el => {
    const hasVerticalScroll = el.scrollHeight > el.clientHeight;
    if (hasVerticalScroll && el.scrollHeight > maxScrollHeight) {
      const computedStyle = window.getComputedStyle(el);
      const overflowY = computedStyle.overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'visible') {
        maxScrollHeight = el.scrollHeight;
        scrollElement = el;
      }
    }
  });
  
  return scrollElement;
}

/**
 * Scrolls to the bottom of a scrollable element or window
 * @param {Element|null} scrollElement - Optional specific element to scroll
 * @returns {void}
 */
export function scrollToBottom(scrollElement = null) {
  if (scrollElement) {
    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
      behavior: 'smooth'
    });
  } else {
    window.scrollTo({
      top: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
      behavior: 'smooth'
    });
  }
}

/**
 * Gets the element path for debugging purposes
 * @param {Element} element - The element to get the path for
 * @returns {string} CSS selector path to the element
 */
export function getElementPath(element) {
  if (!element) return '';
  
  const path = [];
  let current = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    } else if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(' ').filter(c => c).join('.');
      if (classes) {
        selector += `.${classes}`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

/**
 * Creates a cache for DOM queries to improve performance
 * @param {Element} root - Root element to search within
 * @returns {Function} Cache query function
 */
export function createDOMCache(root = document) {
  const cache = new Map();
  
  return function getCached(selector) {
    if (cache.has(selector)) {
      return cache.get(selector);
    }
    const element = root.querySelector(selector);
    cache.set(selector, element);
    return element;
  };
}

/**
 * Scrolls to top of the page or container
 * @param {Element|null} element - Optional element to scroll
 * @returns {void}
 */
export function scrollToTop(element = null) {
  if (element) {
    element.scrollTop = 0;
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Finds the scrollable container for inspection items
 * @returns {Element|null} The inspection items scrollable container
 */
export function findInspectionScrollContainer() {
  const selectors = [
    '[data-qa="section-item-list"]',
    '[style*="overflow: auto"][style*="will-change: transform"]',
    '.StyledListContainer-jPuloL'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  
  // Fallback: find by checking for inspection items
  const containers = Array.from(document.querySelectorAll('[style*="overflow: auto"]'));
  return containers.find(el => {
    return el.querySelector('[data-qa^="inspection-item-"]') || el.querySelector('[data-qa="item-row"]');
  }) || null;
}

/**
 * Validates if a URL is a valid Procore URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid Procore URL
 */
export function isValidProcoreUrl(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    // Check if hostname ends with .procore.com or is app.procore.com
    return urlObj.hostname.endsWith('.procore.com') || urlObj.hostname === 'app.procore.com';
  } catch {
    return false;
  }
}

/**
 * Validates if a URL is a Procore inspection page
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid inspection page
 */
export function isValidProcoreInspectionUrl(url) {
  if (!isValidProcoreUrl(url)) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.includes('/inspections/') || urlObj.pathname.includes('/inspection/');
  } catch {
    return false;
  }
}
