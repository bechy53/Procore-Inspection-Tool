/**
 * Configuration constants for the Procore Inspection Tool
 * @module utils/constants
 */

/**
 * Valid Procore domain patterns
 * @constant {Array<RegExp>}
 */
export const PROCORE_DOMAINS = [
  /^https:\/\/[a-zA-Z0-9-]+\.procore\.com\//,
  /^https:\/\/app\.procore\.com\//
];

/**
 * Procore-specific selectors for DOM elements
 * @constant {Object}
 */
export const PROCORE_SELECTORS = {
  // Item selectors
  ITEM_ROW: '[data-qa="item-row"]',
  INSPECTION_ITEM: '[data-qa^="inspection-item"]',
  INSPECTION_ITEM_PREFIX: 'inspection-item-',
  
  // Section selectors
  SECTION_ITEM_LIST: '[data-qa="section-item-list"]',
  
  // Response selectors
  RESPONSE_BUTTONS: '[data-qa*="conforming"], [data-qa*="non_conforming"], [data-qa*="not_applicable"]',
  TEXT_INPUT: '[data-qa="item-text-input-textarea"]',
  
  // Metadata selectors
  PAGE_TITLE: '[data-qa="page-title"]',
  LOCATION: '[data-qa="location-locations-picker"]',
  INSPECTION_NUMBER: '[data-qa="inspection-number"]',
  INSPECTION_TYPE: '[data-qa="inspection-type"]',
  INSPECTION_STATUS: '[data-qa="inspection-status"]',
  INSPECTION_DATE: '[data-qa="inspection-date"]',
  INSPECTION_ASSIGNEES: '[data-qa="inspection-assignees"]',
  
  // Button prefixes
  CONFORMING: 'conforming',
  NON_CONFORMING: 'non_conforming',
  NOT_APPLICABLE: 'not_applicable'
};

/**
 * Response type constants
 * @constant {Object}
 */
export const RESPONSE_TYPES = {
  YES: 'Yes',
  NO: 'No',
  NA: 'N/A',
  BLANK: 'Blank'
};

/**
 * Timing constants for delays and timeouts (in milliseconds)
 * @constant {Object}
 */
export const TIMING = {
  WAIT_FOR_ELEMENT: 10000,
  SCROLL_DELAY: 100,
  SCROLL_STEP_DELAY: 100,
  FILL_DELAY: 200,
  PROGRESS_UPDATE_DELAY: 500,
  ITEM_RENDER_DELAY: 300,
  MAX_SCROLL_ATTEMPTS: 200,
  SCROLL_STEP_SIZE: 100
};

/**
 * CSV configuration
 * @constant {Object}
 */
export const CSV_CONFIG = {
  HEADERS: ['Title', 'Current Response', 'Response (Fill This)', 'Available Options'],
  COMMENT_PREFIX: '#',
  DELIMITER: ',',
  QUOTE_CHAR: '"',
  NEWLINE: '\n'
};

/**
 * Chrome extension action types
 * @constant {Object}
 */
export const ACTION_TYPES = {
  EXTRACT_ITEMS: 'extractInspectionItems',
  FILL_ITEMS: 'fillInspectionItems',
  CANCEL_EXTRACTION: 'cancelExtraction',
  SCROLL_TO_ITEM: 'scrollToItem',
  SCROLL_TO_BOTTOM: 'scrollToBottom',
  FILL_PROGRESS: 'fillProgress',
  LOG_ERROR: 'logError',
  DOWNLOAD_CSV: 'downloadCSV'
};

/**
 * Status message types
 * @constant {Object}
 */
export const STATUS_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Filter types for inspection items
 * @constant {Object}
 */
export const FILTER_TYPES = {
  ALL: 'all',
  YES: 'yes',
  NO: 'no',
  NA: 'na',
  BLANK: 'blank'
};
