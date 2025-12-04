/**
 * Response matching utilities for intelligent response type detection
 * @module utils/responseMatchers
 */

import { RESPONSE_TYPES, PROCORE_SELECTORS } from './constants.js';

/**
 * Normalizes a response string for comparison
 * @param {string} response - The response string to normalize
 * @returns {string} Normalized lowercase trimmed response
 */
export function normalizeResponse(response) {
  return (response || '').toLowerCase().trim();
}

/**
 * Determines if a response matches "Yes" or "Pass"
 * @param {string} response - The response to check
 * @returns {boolean} True if response is affirmative
 */
export function isYesResponse(response) {
  const normalized = normalizeResponse(response);
  return normalized === 'yes' || normalized === 'pass';
}

/**
 * Determines if a response matches "No" or "Fail"
 * @param {string} response - The response to check
 * @returns {boolean} True if response is negative
 */
export function isNoResponse(response) {
  const normalized = normalizeResponse(response);
  return normalized === 'no' || normalized === 'fail';
}

/**
 * Determines if a response matches "N/A" or "Not Applicable"
 * @param {string} response - The response to check
 * @returns {boolean} True if response is not applicable
 */
export function isNAResponse(response) {
  const normalized = normalizeResponse(response);
  return normalized === 'na' || normalized === 'n/a' || normalized === 'not applicable';
}

/**
 * Gets the response type category from a response string
 * @param {string} response - The response to categorize
 * @returns {string} One of RESPONSE_TYPES (Yes, No, N/A, or Blank)
 */
export function getResponseType(response) {
  if (!response || response.trim() === '') {
    return RESPONSE_TYPES.BLANK;
  }
  
  if (isYesResponse(response)) {
    return RESPONSE_TYPES.YES;
  }
  
  if (isNoResponse(response)) {
    return RESPONSE_TYPES.NO;
  }
  
  if (isNAResponse(response)) {
    return RESPONSE_TYPES.NA;
  }
  
  // If it's text content, treat as "Yes" (filled)
  return RESPONSE_TYPES.YES;
}

/**
 * Gets the Procore button prefix for a given response
 * @param {string} response - The response to get button prefix for
 * @returns {string|null} The button prefix (conforming, non_conforming, not_applicable) or null
 */
export function getButtonPrefixForResponse(response) {
  const normalized = normalizeResponse(response);
  
  if (isYesResponse(normalized)) {
    return PROCORE_SELECTORS.CONFORMING;
  }
  
  if (isNoResponse(normalized)) {
    return PROCORE_SELECTORS.NON_CONFORMING;
  }
  
  if (isNAResponse(normalized)) {
    return PROCORE_SELECTORS.NOT_APPLICABLE;
  }
  
  return null;
}

/**
 * Determines the response type from an inspection item
 * Checks both button responses and text field values
 * @param {Object} item - The inspection item
 * @param {string} item.currentResponse - Button response value
 * @param {string} item.textValue - Text field value
 * @returns {string} One of RESPONSE_TYPES
 */
export function getItemResponseType(item) {
  // Check button response first
  if (item.currentResponse && item.currentResponse.trim() !== '') {
    return getResponseType(item.currentResponse);
  }
  
  // Check text field value
  if (item.textValue && item.textValue.trim() !== '') {
    return getResponseType(item.textValue);
  }
  
  return RESPONSE_TYPES.BLANK;
}
