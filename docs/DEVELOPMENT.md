# Development Guide

This guide will help you set up your development environment and understand the development workflow for the Procore Inspection Tool.

## Prerequisites

- **Chrome Browser**: Version 88 or higher
- **Node.js**: Version 14 or higher (for development tools)
- **Git**: For version control
- **Code Editor**: VS Code recommended

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/bechy53/Procore-Inspection-Tool.git
cd Procore-Inspection-Tool
```

### 2. Install Dependencies

```bash
npm install
```

This will install ESLint and other development dependencies.

### 3. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `Procore-Inspection-Tool` directory
5. The extension should now appear in your extensions list

## Project Structure

```
Procore-Inspection-Tool/
├── src/                  # Source code
│   ├── background/       # Background service worker
│   ├── content/          # Content scripts
│   ├── sidepanel/        # Side panel UI
│   ├── pages/            # Additional pages
│   ├── services/         # Business logic services
│   ├── utils/            # Utility modules
│   └── shared/           # Shared modules
├── assets/               # Static assets (icons, images)
├── docs/                 # Documentation
└── manifest.json         # Extension manifest
```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes**
   - Edit files in the `src/` directory
   - Add JSDoc comments to new functions
   - Follow coding standards (see CONTRIBUTING.md)

3. **Reload the extension**
   - Go to `chrome://extensions/`
   - Click the reload icon for Procore Inspection Tool
   - Or use keyboard shortcut: Ctrl+R (Cmd+R on Mac)

4. **Test your changes**
   - Navigate to a Procore inspection page
   - Open the side panel (click extension icon)
   - Test the feature you modified

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lint:fix
```

### Debugging

#### Background Service Worker

1. Go to `chrome://extensions/`
2. Find Procore Inspection Tool
3. Click "service worker" link
4. Use the DevTools console

#### Content Script

1. Open a Procore inspection page
2. Press F12 to open DevTools
3. Check Console for content script logs
4. Use Sources tab to set breakpoints in `content.js`

#### Side Panel

1. Open the side panel (click extension icon)
2. Right-click in the side panel
3. Select "Inspect"
4. Use DevTools as normal

#### Pages (Bulk Inspector, Detailed Report)

1. Open the page (e.g., Bulk Inspector)
2. Right-click anywhere on the page
3. Select "Inspect"
4. Use DevTools console and debugger

### Console Logging

Use the logger utility for consistent logging:

```javascript
import { info, error, warn, debug } from '../shared/logger.js';

info('Operation started');
error('An error occurred', errorObject);
warn('Potential issue detected');
debug('Detailed debug info', data);
```

## Common Development Tasks

### Adding a New Service

1. Create file in `src/services/`
2. Export functions with JSDoc comments
3. Import and use in other modules

Example:
```javascript
// src/services/myService.js
/**
 * Does something useful
 * @param {string} input - Input parameter
 * @returns {Promise<string>} Result
 */
export async function doSomething(input) {
  // Implementation
}
```

### Adding a New Utility

1. Create file in `src/utils/`
2. Export pure functions
3. Add to constants if adding configuration

### Modifying the UI

1. Edit HTML files in appropriate directory
2. Update CSS files for styling
3. Update JS files for behavior
4. Reload extension and test

### Updating Procore Selectors

If Procore changes their DOM structure:

1. Open `src/utils/constants.js`
2. Update `PROCORE_SELECTORS` object
3. Test on actual Procore pages

## Testing Checklist

Before committing:

- [ ] Code lints without errors (`npm run lint`)
- [ ] Extension loads without errors
- [ ] Extract items works
- [ ] Export CSV works
- [ ] Import CSV works
- [ ] Fill inspection works
- [ ] Bulk inspector works (if modified)
- [ ] No console errors
- [ ] Documentation updated

## Building for Distribution

### Creating a ZIP

To create a distribution ZIP:

```bash
# Exclude unnecessary files
zip -r procore-inspection-tool.zip . \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*.DS_Store" \
  -x "*package-lock.json"
```

Or manually:
1. Create a new directory
2. Copy these files/folders:
   - `src/`
   - `assets/`
   - `manifest.json`
3. Zip the directory

## Troubleshooting

### Extension Won't Load

- Check `manifest.json` for syntax errors
- Verify all file paths are correct
- Check browser console for errors

### Changes Not Appearing

- Make sure you reloaded the extension
- Hard refresh the Procore page (Ctrl+Shift+R)
- Check if you edited the right file

### Content Script Not Running

- Verify URL matches in `manifest.json`
- Check if page has finished loading
- Look for errors in page console

### Service Worker Errors

- Check background service worker console
- Verify imports are correct
- Check for syntax errors

### Side Panel Not Opening

- Check if action click listener is registered
- Verify `side_panel` configuration in manifest
- Check background service worker console

## Performance Tips

### Optimizing Extraction

- Minimize DOM queries
- Use caching for repeated queries
- Batch DOM reads and writes
- Use requestAnimationFrame for animations

### Optimizing Fill Operations

- Process items in chunks
- Add delays between operations
- Update progress incrementally
- Cancel operations when needed

## Chrome Extension APIs

### Commonly Used APIs

- **chrome.tabs**: Interact with tabs
- **chrome.runtime**: Messaging and lifecycle
- **chrome.storage**: Persistent storage
- **chrome.sidePanel**: Side panel management
- **chrome.downloads**: File downloads

### API Documentation

- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/reference/)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)

## VS Code Setup

### Recommended Extensions

- ESLint
- Chrome Extension Debugger
- JavaScript (ES6) code snippets

### Settings

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript"]
}
```

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Commit Messages

Follow conventional commits:
```
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: improve code structure
```

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [JavaScript MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [ESLint Rules](https://eslint.org/docs/rules/)

## Getting Help

- Check the [README.md](../README.md)
- Review [ARCHITECTURE.md](ARCHITECTURE.md)
- Search existing issues
- Ask in discussions

## Next Steps

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Check [ARCHITECTURE.md](ARCHITECTURE.md) to understand the codebase
- Review [API.md](API.md) for API documentation

Happy coding! 🚀
