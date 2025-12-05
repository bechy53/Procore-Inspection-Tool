# Architecture

This document describes the architecture of the Procore Inspection Tool Chrome extension.

## Overview

The Procore Inspection Tool is a Chrome extension built with Manifest V3 that helps users review and fill out Procore inspections using CSV import/export functionality with support for bulk multi-tab analysis.

## Directory Structure

```
Procore-Inspection-Tool/
├── src/                          # Source code
│   ├── background/               # Background service worker
│   │   └── background.js         # Service worker entry point
│   ├── content/                  # Content scripts
│   │   └── content.js            # Main content script for Procore pages
│   ├── sidepanel/                # Side panel UI
│   │   ├── sidepanel.html        # Side panel HTML
│   │   ├── sidepanel.js          # Side panel logic
│   │   └── sidepanel.css         # Side panel styles
│   ├── pages/                    # Additional pages
│   │   ├── bulk-inspector/       # Bulk inspector feature
│   │   │   ├── bulk-inspector.html
│   │   │   ├── bulk-inspector.js
│   │   │   └── bulk-inspector.css
│   │   └── detailed-report/      # Detailed report page
│   │       ├── detailed-report.html
│   │       ├── detailed-report.js
│   │       └── detailed-report.css
│   ├── services/                 # Business logic services
│   │   ├── csvService.js         # CSV parsing and export
│   │   ├── storageService.js     # Chrome storage management
│   ├── utils/                    # Utility modules
│   │   ├── constants.js          # Configuration constants
│   │   ├── domUtils.js           # DOM manipulation helpers
│   │   ├── messageUtils.js       # Chrome messaging utilities
│   │   └── responseMatchers.js   # Response matching logic
│   └── shared/                   # Shared modules
│       └── logger.js             # Logging utility
├── assets/                       # Static assets
│   └── Icons/                    # Extension icons
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # This file
│   ├── CONTRIBUTING.md           # Contribution guidelines
│   ├── DEVELOPMENT.md            # Development setup
│   └── API.md                    # API documentation
├── manifest.json                 # Chrome extension manifest
├── README.md                     # Main documentation
├── CHANGELOG.md                  # Version history
├── package.json                  # NPM configuration
├── .eslintrc.json                # ESLint configuration
└── .gitignore                    # Git ignore rules
```

## Architecture Layers

### 1. Background Layer (`src/background/`)

The background service worker handles:
- Extension lifecycle events
- Side panel management
- CSV download operations
- Cross-context messaging coordination

**Key File**: `background.js`

### 2. Content Scripts Layer (`src/content/`)

Content scripts run in the context of Procore web pages and handle:
- Inspection item extraction from the DOM
- Form filling operations
- Scrolling and navigation
- Metadata extraction

**Key File**: `content.js`

### 3. UI Layer

#### Side Panel (`src/sidepanel/`)
- Primary user interface
- Tab-based navigation (Single Inspection / Bulk Inspector)
- Item display and filtering
- CSV import/export controls

#### Pages (`src/pages/`)
- **Bulk Inspector**: Multi-tab inspection analysis
- **Detailed Report**: Comprehensive inspection reports

### 4. Services Layer (`src/services/`)

Reusable business logic modules:

- **csvService.js**: CSV parsing, export, and filename generation
- **storageService.js**: Chrome storage API wrapper

### 5. Utilities Layer (`src/utils/`)

Helper functions and constants:

- **constants.js**: Configuration values, selectors, action types
- **domUtils.js**: DOM manipulation, scrolling, element finding
- **messageUtils.js**: Chrome messaging helpers
- **responseMatchers.js**: Intelligent response type detection

### 6. Shared Layer (`src/shared/`)

Common utilities used across all contexts:

- **logger.js**: Consistent logging with levels

## Data Flow

### Extraction Flow

```
User Action (Side Panel)
    ↓
Message to Active Tab
    ↓
Content Script (content.js)
    ↓
DOM Extraction + Scrolling
    ↓
Response to Side Panel
    ↓
Display Items + Statistics
```

### Fill Flow

```
User Imports CSV (Side Panel)
    ↓
CSV Parsing (csvService)
    ↓
Message to Active Tab with Items
    ↓
Content Script (content.js)
    ↓
Scroll + Fill Each Item
    ↓
Progress Updates to Side Panel
    ↓
Completion Report
```

### Bulk Inspection Flow

```
User Opens Bulk Inspector Tab
    ↓
Scan All Open Tabs
    ↓
Query Each Tab for Inspection Data
    ↓
Aggregate Results
    ↓
Display Summary + Allow Filtering
    ↓
Export to CSV
```

## Communication Patterns

### Chrome Messaging

The extension uses Chrome's messaging API for communication:

1. **Side Panel ↔ Content Script**: `chrome.tabs.sendMessage()`
2. **Content Script → Background**: `chrome.runtime.sendMessage()`
3. **Background ↔ Side Panel**: `chrome.runtime.sendMessage()`

### Message Types

Defined in `constants.js`:
- `extractInspectionItems`: Extract items from page
- `fillInspectionItems`: Fill form with CSV data
- `scrollToItem`: Navigate to specific item
- `cancelExtraction`: Cancel ongoing extraction
- `fillProgress`: Update progress bar

## Design Patterns

### Service Pattern
Services encapsulate reusable business logic with well-defined interfaces.

### Utility Pattern
Pure functions for common operations (DOM, messaging, response matching).

### Module Pattern
ES6 modules with named exports for better tree-shaking.

### Observer Pattern
Chrome messaging for event-driven communication.

## Security Considerations

1. **Content Security Policy**: Inline scripts are avoided
2. **Permissions**: Minimal required permissions
3. **Data Privacy**: All processing happens locally
4. **Input Validation**: CSV parsing validates data
5. **XSS Prevention**: HTML escaping for user content

## Performance Optimizations

1. **DOM Caching**: Query results cached during extraction
2. **Lazy Loading**: Virtual scrolling handled intelligently
3. **Debouncing**: Progress updates throttled
4. **Minimal Re-renders**: Items displayed only when necessary
5. **Incremental Processing**: Large operations chunked

## Browser Compatibility

- **Target**: Chrome 88+ (Manifest V3 support)
- **APIs Used**:
  - Side Panel API
  - Tabs API
  - Storage API
  - Downloads API
  - Scripting API

## Future Considerations

- TypeScript migration for type safety
- Unit tests for services and utilities
- Integration tests for workflows
- Performance monitoring
- Error tracking
- User analytics (privacy-preserving)
