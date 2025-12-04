# Procore Inspection Tool

A Chrome extension that allows you to review and fill out Procore inspections using CSV import/export functionality with bulk multi-tab analysis.

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Documentation](#documentation)
- [Development](#development)
- [Support](#support)

## ✨ Features

- **Extract Inspection Items**: Scan the current Procore inspection page and extract all inspection items
- **Bulk Inspector** ✨ NEW: Analyze multiple inspection tabs simultaneously to identify missing items across all open inspections
- **Response Report**: View counts of Yes, No, N/A, and Blank responses with filtering capabilities
- **Export to CSV**: Download inspection items as a CSV file for easy editing
- **Bulk Fill**: Import a filled CSV file and automatically populate the inspection form
- **Progress Tracking**: Real-time progress bars for extraction and filling operations
- **Navigate to Items**: Click any item in the extension to jump to it on the webpage
- **Dark Mode UI**: Modern dark theme based on Procore's orange color palette
- **Side Panel Interface**: Clean, non-intrusive side panel that works alongside Procore

## 📦 Installation

### From Source

1. Clone or download this repository:
   ```bash
   git clone https://github.com/bechy53/Procore-Inspection-Tool.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `Procore-Inspection-Tool` folder
5. The Procore Inspection Tool icon should appear in your extensions toolbar

## 🚀 Quick Start

1. **Navigate** to a Procore inspection page
2. **Click** the extension icon to open the side panel
3. **Extract** items from the page
4. **Export** to CSV, edit in Excel/Sheets
5. **Import** the filled CSV back
6. **Fill** the inspection automatically

## 📖 Usage

### 1. Extract Inspection Items

1. Navigate to a Procore inspection page
2. Click the extension icon to open the side panel
3. Click the **"Extract Items"** button
4. The extension will scan the page and display all inspection items

### 2. Export to CSV

1. After extracting items, click the **"Export CSV"** button
2. Save the CSV file to your computer
3. The CSV will contain columns for:
   - Index
   - Title (item question/description)
   - Current Response (already filled value)
   - Response (column to fill with Yes/No/NA)
   - Notes (column to fill with text notes)
   - Available Options (possible response values)

### 3. Fill Out the CSV

Open the CSV file in Excel, Google Sheets, or any spreadsheet application and:

- Fill the **"Response (Fill This)"** column with values like:
  - `Yes` or `Pass`
  - `No` or `Fail`
  - `NA` or `N/A`
  - Any other option from the "Available Options" column

- Fill the **"Notes (Fill This)"** column with any text notes or observations

### 4. Import and Fill Inspection

1. Click **"Import CSV to Fill"** and select your filled CSV file
2. Once loaded, click the **"Fill Inspection"** button
3. The extension will automatically:
   - Check the appropriate radio buttons/checkboxes
   - Fill in text fields with your notes
   - Match responses intelligently (e.g., "Yes" matches "Pass", "NA" matches "N/A")

### 5. Bulk Inspector (Multi-Tab Analysis)

For analyzing multiple inspections at once:

1. **Open Multiple Inspections**: Open all Procore inspection pages you want to analyze in separate Chrome tabs
2. **Launch Bulk Inspector**: Click the **"🔍 Bulk Inspector"** button at the top of the side panel
3. **Scan Tabs**: In the new window, click **"Scan Open Tabs"** to detect all inspection pages
4. **Select Inspections**: Choose which inspections to analyze (all are selected by default)
5. **Extract All**: Click **"Extract All Inspections"** to gather data from all selected tabs
6. **Review Summary**: The bulk inspector shows:
   - Total inspections analyzed
   - Total items across all inspections
   - Count of incomplete items
   - Detailed breakdown per inspection with expandable sections
7. **Filter Results**: Use filters to view only complete or incomplete inspections
8. **Export Summary**: Click **"Export Summary CSV"** for a comprehensive report of all inspections

**Bulk Inspector Benefits:**
- Quality control across multiple inspections
- Quickly identify patterns in missing data
- Generate compliance reports
- Save time managing large inspection workflows
- Get a bird's-eye view of inspection completion status

## CSV Format

The exported CSV has the following structure:

```csv
Index,Title,Current Response,Response (Fill This),Notes (Fill This),Available Options
0,Item description here,,"Yes","All items checked and verified","Yes; No; N/A"
1,Another item,,"No","Issue found - needs attention","Pass; Fail; N/A"
```

## Supported Procore Elements

The extension detects and works with:

- Radio buttons (Yes/No/NA)
- Checkboxes
- Select dropdowns
- Text input fields
- Textarea fields
- Contenteditable fields

## Tips

- **Response Matching**: The extension intelligently matches your CSV responses:
  - "Yes" → matches "Yes", "Pass", etc.
  - "No" → matches "No", "Fail", etc.
  - "NA" → matches "N/A", "Not Applicable", etc.

- **Bulk Processing**: Process hundreds of inspection items in seconds instead of clicking through each one manually

- **Reusable Templates**: Save filled CSV files as templates for similar inspections

- **Error Handling**: After filling, the extension reports how many items were successfully filled and any errors encountered

## Troubleshooting

### "Could not find inspection items on this page"
- Make sure you're on an actual Procore inspection page
- Wait for the page to fully load before extracting
- Try refreshing the page and extracting again

### Items not filling correctly
- Check that your CSV responses match the available options
- Ensure the CSV format hasn't been corrupted (commas in fields should be quoted)
- The extension may need updates if Procore's page structure has changed

### Import button disabled
- First extract items from the current page
- Only then can you import a CSV file

## Privacy & Permissions

This extension requires:

- **Access to Procore pages**: To read and interact with inspection forms
- **Tabs permission**: To manage multiple inspection tabs for bulk operations
- **Downloads permission**: To export CSV files
- **Storage permission**: To save extension state
- **Scripting permission**: To inject content scripts into Procore pages

All data processing happens locally in your browser. No data is sent to external servers.

## 📚 Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)** - Understand the codebase structure
- **[Development Guide](docs/DEVELOPMENT.md)** - Set up your development environment
- **[Contributing Guide](docs/CONTRIBUTING.md)** - Contribute to the project
- **[API Documentation](docs/API.md)** - API reference for services and utilities
- **[Changelog](CHANGELOG.md)** - Version history and updates

## 🛠️ Development

### Prerequisites

- Chrome 88+
- Node.js 14+ (for development tools)
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bechy53/Procore-Inspection-Tool.git
   cd Procore-Inspection-Tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

### Project Structure

```
Procore-Inspection-Tool/
├── src/
│   ├── background/       # Background service worker
│   ├── content/          # Content scripts
│   ├── sidepanel/        # Side panel UI
│   ├── pages/            # Additional pages
│   ├── services/         # Business logic services
│   ├── utils/            # Utility modules
│   └── shared/           # Shared modules
├── assets/               # Icons and images
├── docs/                 # Documentation
└── manifest.json         # Extension manifest
```

### Development Workflow

1. Make changes to files in `src/`
2. Reload extension in Chrome
3. Test on Procore pages
4. Run linting: `npm run lint`
5. Commit and push

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development guide.

### Code Quality

```bash
# Lint code
npm run lint

# Auto-fix issues
npm run lint:fix
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](docs/CONTRIBUTING.md) for details on:

- Code of conduct
- Development process
- Coding standards
- Pull request process

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Support

For issues, feature requests, or questions:

1. Check existing [issues](https://github.com/bechy53/Procore-Inspection-Tool/issues)
2. Review [documentation](docs/)
3. Open a new issue with detailed information

## 🙏 Acknowledgments

- Built with Chrome Manifest V3
- Uses Chrome Side Panel API
- Designed for Procore's inspection workflow

## 📊 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

**v1.1.0** (December 2025)
- Added Bulk Inspector feature for multi-tab inspection analysis
- Restructured codebase with services and utilities layer
- Enhanced documentation and developer experience

**v1.0.0** (November 2025)
- Initial release
- Extract inspection items
- CSV export/import
- Bulk fill functionality
- Dark mode UI
