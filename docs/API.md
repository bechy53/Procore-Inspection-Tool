# API Documentation

This document describes the public APIs and interfaces of the Procore Inspection Tool.

## Table of Contents

- [Services](#services)
  - [CSV Service](#csv-service)
  - [Storage Service](#storage-service)
- [Utilities](#utilities)
  - [Constants](#constants)
  - [DOM Utils](#dom-utils)
  - [Message Utils](#message-utils)
  - [Response Matchers](#response-matchers)
- [Logger](#logger)
- [Chrome Messaging](#chrome-messaging)

---

## Services

### CSV Service

Module: `src/services/csvService.js`

#### `escapeCsvValue(value)`

Escapes a CSV value by adding quotes if needed.

**Parameters:**
- `value` (any): Value to escape

**Returns:** `string` - Escaped CSV value

**Example:**
```javascript
import { escapeCsvValue } from './services/csvService.js';

const escaped = escapeCsvValue('Hello, World');
// Returns: '"Hello, World"'
```

#### `cleanTitle(title)`

Cleans a title by removing non-ASCII characters.

**Parameters:**
- `title` (string): Title to clean

**Returns:** `string` - Cleaned title

#### `parseCSVLine(line)`

Parses a single CSV line handling quoted values.

**Parameters:**
- `line` (string): CSV line to parse

**Returns:** `Array<string>` - Array of values

#### `parseCSV(text)`

Parses CSV text into an array of inspection items.

**Parameters:**
- `text` (string): CSV text content

**Returns:** `Array<Object>` - Array of parsed items

**Example:**
```javascript
const items = parseCSV(csvText);
// Returns: [{ itemNumber, title, response, ... }, ...]
```

#### `exportToCSV(items, metadata)`

Exports inspection items to CSV format.

**Parameters:**
- `items` (Array<Object>): Inspection items to export
- `metadata` (Object|null): Optional inspection metadata

**Returns:** `string` - CSV content

#### `generateCSVFilename(metadata)`

Generates a filename for CSV export.

**Parameters:**
- `metadata` (Object|null): Optional inspection metadata

**Returns:** `string` - Generated filename

---

### Storage Service

Module: `src/services/storageService.js`

#### `get(key)`

Gets a value from Chrome storage.

**Parameters:**
- `key` (string): Storage key

**Returns:** `Promise<any>` - The stored value

**Example:**
```javascript
import { get } from './services/storageService.js';

const data = await get('inspectionData');
```

#### `set(key, value)`

Sets a value in Chrome storage.

**Parameters:**
- `key` (string): Storage key
- `value` (any): Value to store

**Returns:** `Promise<void>`

#### `remove(key)`

Removes a value from Chrome storage.

**Parameters:**
- `key` (string): Storage key

**Returns:** `Promise<void>`

#### `clear()`

Clears all data from Chrome storage.

**Returns:** `Promise<void>`

#### `getAll()`

Gets all data from Chrome storage.

**Returns:** `Promise<Object>` - All stored data

---

## Utilities

### Constants

Module: `src/utils/constants.js`

#### `PROCORE_SELECTORS`

Object containing Procore-specific DOM selectors.

**Properties:**
- `ITEM_ROW`: Selector for item rows
- `INSPECTION_ITEM`: Selector for inspection items
- `TEXT_INPUT`: Selector for text inputs
- `PAGE_TITLE`: Selector for page title
- etc.

#### `RESPONSE_TYPES`

Object containing response type constants.

**Properties:**
- `YES`: 'Yes'
- `NO`: 'No'
- `NA`: 'N/A'
- `BLANK`: 'Blank'

#### `TIMING`

Object containing timing constants (in milliseconds).

#### `CSV_CONFIG`

Object containing CSV configuration.

#### `ACTION_TYPES`

Object containing Chrome extension action types.

---

### DOM Utils

Module: `src/utils/domUtils.js`

#### `waitForElement(selector, timeout)`

Waits for an element to appear in the DOM.

**Parameters:**
- `selector` (string): CSS selector
- `timeout` (number): Maximum wait time in ms (default: 10000)

**Returns:** `Promise<Element>` - The found element

**Throws:** `Error` - If element not found

#### `sleep(ms)`

Utility to sleep for a specified duration.

**Parameters:**
- `ms` (number): Milliseconds to sleep

**Returns:** `Promise<void>`

#### `escapeHtml(text)`

Escapes HTML special characters.

**Parameters:**
- `text` (string): Text to escape

**Returns:** `string` - Escaped text

#### `findScrollableContainer()`

Finds the largest scrollable container.

**Returns:** `Element|null` - The scrollable element

#### `scrollToBottom(scrollElement)`

Scrolls to bottom of element or window.

**Parameters:**
- `scrollElement` (Element|null): Optional element to scroll

**Returns:** `void`

#### `scrollToTop(element)`

Scrolls to top of page or container.

**Parameters:**
- `element` (Element|null): Optional element to scroll

**Returns:** `void`

#### `getElementPath(element)`

Gets the element path for debugging.

**Parameters:**
- `element` (Element): The element

**Returns:** `string` - CSS selector path

#### `createDOMCache(root)`

Creates a cache for DOM queries.

**Parameters:**
- `root` (Element): Root element (default: document)

**Returns:** `Function` - Cache query function

#### `findInspectionScrollContainer()`

Finds the scrollable container for inspection items.

**Returns:** `Element|null` - The container

---

### Message Utils

Module: `src/utils/messageUtils.js`

#### `sendMessageToActiveTab(message)`

Sends a message to the active tab.

**Parameters:**
- `message` (Object): Message to send

**Returns:** `Promise<any>` - Response from tab

**Example:**
```javascript
import { sendMessageToActiveTab } from './utils/messageUtils.js';

const response = await sendMessageToActiveTab({
  action: 'extractInspectionItems'
});
```

#### `sendMessageToTab(tabId, message)`

Sends a message to a specific tab.

**Parameters:**
- `tabId` (number): Tab ID
- `message` (Object): Message to send

**Returns:** `Promise<any>` - Response

#### `sendMessageToBackground(message)`

Sends a message to the background service worker.

**Parameters:**
- `message` (Object): Message to send

**Returns:** `Promise<any>` - Response

#### `getActiveTab()`

Gets the active tab.

**Returns:** `Promise<chrome.tabs.Tab>` - The active tab

#### `isConnectionError(error)`

Checks if an error is a connection error.

**Parameters:**
- `error` (Error): The error to check

**Returns:** `boolean` - True if connection error

#### `sendProgressUpdate(text, percent, complete)`

Updates progress in the UI via message.

**Parameters:**
- `text` (string): Progress text
- `percent` (number): Progress percentage (0-100)
- `complete` (boolean): Whether complete (default: false)

**Returns:** `void`

---

### Response Matchers

Module: `src/utils/responseMatchers.js`

#### `normalizeResponse(response)`

Normalizes a response string.

**Parameters:**
- `response` (string): Response to normalize

**Returns:** `string` - Normalized response

#### `isYesResponse(response)`

Checks if response is affirmative.

**Parameters:**
- `response` (string): Response to check

**Returns:** `boolean` - True if Yes/Pass

#### `isNoResponse(response)`

Checks if response is negative.

**Parameters:**
- `response` (string): Response to check

**Returns:** `boolean` - True if No/Fail

#### `isNAResponse(response)`

Checks if response is not applicable.

**Parameters:**
- `response` (string): Response to check

**Returns:** `boolean` - True if N/A

#### `getResponseType(response)`

Gets the response type category.

**Parameters:**
- `response` (string): Response to categorize

**Returns:** `string` - One of RESPONSE_TYPES

#### `getButtonPrefixForResponse(response)`

Gets the Procore button prefix for a response.

**Parameters:**
- `response` (string): Response

**Returns:** `string|null` - Button prefix or null

#### `getItemResponseType(item)`

Determines response type from an inspection item.

**Parameters:**
- `item` (Object): Inspection item

**Returns:** `string` - One of RESPONSE_TYPES

---

## Logger

Module: `src/shared/logger.js`

#### `setLogLevel(level)`

Sets the logging level.

**Parameters:**
- `level` (string): 'debug', 'info', 'warn', or 'error'

#### `debug(message, ...args)`

Logs a debug message.

**Parameters:**
- `message` (string): Message to log
- `...args` (any): Additional arguments

#### `info(message, ...args)`

Logs an info message.

#### `warn(message, ...args)`

Logs a warning message.

#### `error(message, ...args)`

Logs an error message.

#### `logErrorToBackground(errorObj)`

Sends an error to background for logging.

**Parameters:**
- `errorObj` (Error|string): Error to log

---

## Chrome Messaging

### Message Structure

All messages follow this structure:

```javascript
{
  action: 'actionName',
  // Additional properties based on action
}
```

### Action Types

From `src/utils/constants.js`:

- `extractInspectionItems`: Extract items from page
- `fillInspectionItems`: Fill form with data
- `scrollToItem`: Navigate to item
- `cancelExtraction`: Cancel extraction
- `fillProgress`: Update progress
- `logError`: Log error
- `downloadCSV`: Download CSV file

### Example: Extract Items

**Send:**
```javascript
{
  action: 'extractInspectionItems'
}
```

**Receive:**
```javascript
{
  success: true,
  items: [...],
  metadata: {...},
  url: 'https://...'
}
```

### Example: Fill Items

**Send:**
```javascript
{
  action: 'fillInspectionItems',
  items: [
    { itemNumber: '1.1', response: 'Yes' },
    ...
  ]
}
```

**Receive:**
```javascript
{
  success: true,
  result: {
    successCount: 10,
    skippedCount: 2,
    errorCount: 0,
    total: 12
  }
}
```

---

## Types

### Inspection Item

```javascript
{
  uniqueId: string,           // e.g., "inspection-item-1.1"
  itemNumber: string,         // e.g., "1.1"
  title: string,              // Item question/description
  currentResponse: string,    // Current button response
  textValue: string,          // Current text field value
  availableOptions: string[], // Available response options
  scrollToCenterPosition: number, // Scroll position
  elementPath: string         // DOM path for debugging
}
```

### Inspection Metadata

```javascript
{
  inspectionName: string,
  location: string,
  inspectionNumber: string,
  inspectionType: string,
  status: string,
  inspectionDate: string,
  assignees: string
}
```

---

## Error Handling

All async functions throw errors that should be caught:

```javascript
try {
  const items = await extractItems();
} catch (error) {
  console.error('Extraction failed:', error);
}
```

Connection errors can be detected with:

```javascript
import { isConnectionError } from './utils/messageUtils.js';

try {
  // ... operation
} catch (error) {
  if (isConnectionError(error)) {
    // Handle connection error
  } else {
    // Handle other error
  }
}
```

---

## Best Practices

1. **Always use constants**: Import from `constants.js`
2. **Use utilities**: Don't duplicate logic
3. **Handle errors**: Wrap async calls in try/catch
4. **Add JSDoc**: Document all public functions
5. **Validate inputs**: Check parameters before use
6. **Log appropriately**: Use logger for consistency
