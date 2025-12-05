# Contributing to Procore Inspection Tool

Thank you for your interest in contributing to the Procore Inspection Tool! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/bechy53/Procore-Inspection-Tool.git
   cd Procore-Inspection-Tool
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the coding standards below
   - Add JSDoc comments to new functions
   - Update documentation as needed

## Development Process

### Before You Start

1. Check existing issues to see if your idea is already being discussed
2. For major changes, open an issue first to discuss your proposal
3. Ensure you have the latest code from the main branch

### Making Changes

1. **Keep changes focused**: One feature or fix per pull request
2. **Write clear code**: Use descriptive variable and function names
3. **Add comments**: Especially for complex logic
4. **Update docs**: Keep README.md and other docs up to date

## Coding Standards

### JavaScript

- **Use ES6+ features**: Arrow functions, destructuring, async/await
- **Use const/let**: Never use var
- **Semicolons**: Always use semicolons
- **Quotes**: Use single quotes for strings
- **Indentation**: 2 spaces
- **Line length**: Keep lines under 100 characters when possible

### JSDoc Comments

All functions should have JSDoc comments:

```javascript
/**
 * Brief description of what the function does
 * @param {Type} paramName - Description of parameter
 * @returns {Type} Description of return value
 * @throws {Error} When this error occurs
 */
function exampleFunction(paramName) {
  // Implementation
}
```

### File Organization

- **Services**: Reusable business logic in `src/services/`
- **Utilities**: Pure helper functions in `src/utils/`
- **Constants**: Configuration in `src/utils/constants.js`
- **UI Components**: In appropriate directories under `src/`

### Naming Conventions

- **Files**: camelCase.js (e.g., `csvService.js`)
- **Classes**: PascalCase (e.g., `InspectionHandler`)
- **Functions**: camelCase (e.g., `extractItems`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Private functions**: Prefix with underscore (e.g., `_helperFunction`)

## Commit Guidelines

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```
feat: add CSV export validation

Add validation for CSV data before export to catch malformed
inspection items early and provide helpful error messages.

Closes #123
```

```
fix: resolve scroll position bug in extraction

The extraction was not properly handling virtual scroll containers.
Updated to detect and use the correct viewport element.
```

## Pull Request Process

1. **Update documentation**: Ensure README.md, CHANGELOG.md, and relevant docs are updated
2. **Run linting**: `npm run lint`
3. **Test your changes**: Load the extension in Chrome and test thoroughly
4. **Write a clear PR description**:
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Screenshots for UI changes

5. **Link related issues**: Use "Closes #123" or "Fixes #456"
6. **Request review**: Tag maintainers for review
7. **Address feedback**: Make requested changes promptly
8. **Squash commits**: If requested, squash your commits into logical units

### PR Title Format

Use the same format as commit messages:
```
feat: add new feature
fix: resolve bug
docs: update documentation
```

## Testing

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] Extension loads without errors
- [ ] Extract items works on a Procore inspection page
- [ ] CSV export generates valid file
- [ ] CSV import parses correctly
- [ ] Fill inspection populates form correctly
- [ ] Bulk inspector scans multiple tabs
- [ ] UI is responsive and styled correctly
- [ ] No console errors or warnings

### Browser Testing

Test your changes in:
- Chrome (latest stable)
- Chrome (latest beta) if making significant changes

### Edge Cases

Consider and test:
- Empty inspection pages
- Very large inspections (100+ items)
- Malformed CSV files
- Network errors
- Page refresh during operation
- Multiple extensions installed

## Code Review

### What Reviewers Look For

- **Correctness**: Does it work as intended?
- **Quality**: Is the code clean and maintainable?
- **Performance**: Are there any performance issues?
- **Security**: Are there any security concerns?
- **Documentation**: Is it well documented?
- **Tests**: Are edge cases covered?

### Responding to Reviews

- Be receptive to feedback
- Ask questions if unclear
- Make requested changes or explain why not
- Thank reviewers for their time

## Questions?

If you have questions:
1. Check existing documentation
2. Search closed issues
3. Open a new issue with the "question" label

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Thank You!

Your contributions help make this tool better for everyone. We appreciate your time and effort!
