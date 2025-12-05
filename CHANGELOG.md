# Changelog

All notable changes to the Procore Inspection Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **BREAKING**: Restructured codebase to follow standard architecture patterns
- Organized files into logical directories (`src/`, `assets/`, `docs/`)
- Separated concerns into modules (utils, services, UI, content scripts)
- Added JSDoc comments to all functions
- Improved code organization with clear dependencies
- Enhanced documentation with comprehensive guides

### Added
- Services layer for reusable business logic (csvService, storageService)
- Utility modules (constants, domUtils, messageUtils, responseMatchers)
- Logger utility for consistent logging
- Developer experience files (.gitignore, package.json, .eslintrc.json)
- Comprehensive documentation (ARCHITECTURE.md, CONTRIBUTING.md, DEVELOPMENT.md, API.md)
- Configuration management through constants

## [1.1.0] - 2025-12-04

### Added
- Bulk Inspector feature for multi-tab inspection analysis
- Enhanced UI with purple accent for Bulk Inspector
- Comprehensive summary reports
- Export functionality for bulk inspection data
- Ability to analyze multiple inspections simultaneously
- Quality control across multiple inspections
- Filter results by completion status

### Changed
- Updated UI to support tab-based navigation
- Improved inspection metadata extraction
- Enhanced progress tracking for bulk operations

## [1.0.0] - 2025-11-01

### Added
- Initial release
- Extract inspection items from Procore pages
- CSV export/import functionality
- Bulk fill functionality
- Dark mode UI based on Procore's orange color palette
- Side panel interface
- Navigate to items feature
- Response filtering (Yes/No/N/A/Blank)
- Real-time progress bars
- Intelligent response matching
- Support for radio buttons, checkboxes, dropdowns, and text inputs

[Unreleased]: https://github.com/bechy53/Procore-Inspection-Tool/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/bechy53/Procore-Inspection-Tool/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/bechy53/Procore-Inspection-Tool/releases/tag/v1.0.0
