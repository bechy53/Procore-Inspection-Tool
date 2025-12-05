/**
 * CSV service for parsing and exporting CSV files
 * @module services/csvService
 */

import { CSV_CONFIG } from '../utils/constants.js';

/**
 * Escapes a CSV value by adding quotes if needed
 * @param {any} value - Value to escape
 * @returns {string} Escaped CSV value
 */
export function escapeCsvValue(value) {
  if (!value) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Cleans a title by removing non-ASCII characters
 * @param {string} title - Title to clean
 * @returns {string} Cleaned title
 */
export function cleanTitle(title) {
  return title
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Parses a single CSV line handling quoted values
 * @param {string} line - CSV line to parse
 * @returns {Array<string>} Array of values
 */
export function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

/**
 * Parses CSV text into an array of inspection items
 * @param {string} text - CSV text content
 * @returns {Array<Object>} Array of parsed items
 */
export function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Skip header row
  const dataLines = lines.slice(1);
  const items = [];

  dataLines.forEach((line) => {
    const values = parseCSVLine(line);
    
    if (values.length >= 2) {
      // Extract item number from title
      const title = values[0];
      const currentResponse = values[1] ? values[1].trim() : '';
      const fillResponse = values[2] ? values[2].trim() : '';
      const response = fillResponse || currentResponse;
      let itemNumber = '';
      
      // Get everything before the first space
      const firstSpace = title.indexOf(' ');
      if (firstSpace > 0) {
        const beforeSpace = title.substring(0, firstSpace).trim();
        // Check if it looks like an item number (contains digits and dots/periods)
        if (/^[\d.]+$/.test(beforeSpace)) {
          itemNumber = beforeSpace;
        }
      }
      
      // Only add items with valid item numbers and responses
      if (itemNumber && response) {
        items.push({
          index: parseInt(itemNumber.split('.')[0]) || 0,
          itemNumber: itemNumber,
          title: title,
          currentResponse: currentResponse,
          response: response
        });
      }
    }
  });
  
  return items;
}

/**
 * Exports inspection items to CSV format
 * @param {Array<Object>} items - Inspection items to export
 * @param {Object} metadata - Inspection metadata
 * @returns {string} CSV content
 */
export function exportToCSV(items, metadata = null) {
  let csvContent = '';
  
  // Add metadata as comments at the top
  if (metadata) {
    csvContent += `${CSV_CONFIG.COMMENT_PREFIX} Inspection Name: ${metadata.inspectionName || ''}\n`;
    csvContent += `${CSV_CONFIG.COMMENT_PREFIX} Location: ${metadata.location || ''}\n`;
    csvContent += `${CSV_CONFIG.COMMENT_PREFIX} Number: ${metadata.inspectionNumber || ''}\n`;
    csvContent += `${CSV_CONFIG.COMMENT_PREFIX} Type: ${metadata.inspectionType || ''}\n`;
    csvContent += `${CSV_CONFIG.COMMENT_PREFIX} Status: ${metadata.status || ''}\n`;
    csvContent += `${CSV_CONFIG.COMMENT_PREFIX} Date: ${metadata.inspectionDate || ''}\n`;
    csvContent += `${CSV_CONFIG.COMMENT_PREFIX}\n`;
  }
  
  const headers = CSV_CONFIG.HEADERS;
  const rows = items.map(item => [
    escapeCsvValue(cleanTitle(item.title)),
    escapeCsvValue(item.currentResponse || item.textValue),
    escapeCsvValue(item.currentResponse || item.textValue),
    escapeCsvValue(item.availableOptions.join('; '))
  ]);

  csvContent += [
    headers.join(CSV_CONFIG.DELIMITER),
    ...rows.map(row => row.join(CSV_CONFIG.DELIMITER))
  ].join(CSV_CONFIG.NEWLINE);

  return csvContent;
}

/**
 * Generates a filename for CSV export
 * @param {Object} metadata - Inspection metadata
 * @returns {string} Generated filename
 */
export function generateCSVFilename(metadata = null) {
  const timestamp = new Date().toISOString().split('T')[0];
  const inspectionName = metadata?.inspectionName 
    ? metadata.inspectionName.replace(/[^a-z0-9]/gi, '_').substring(0, 30) 
    : 'inspection';
  return `${inspectionName}_${timestamp}.csv`;
}
