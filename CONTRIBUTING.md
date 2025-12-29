# Contributing to Google Calendar Dispatch Action

Thank you for your interest in contributing! This document provides guidelines
and instructions for contributing to this project.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome
contributions from everyone.

## Getting Started

### Prerequisites

- Node.js 24.x (see `.node-version`)
- npm

### Setup

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/your-username/google-calendar-dispatch-action.git
   cd google-calendar-dispatch-action
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a branch for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Project Structure

```
src/
├── index.ts          # Entry point
├── main.ts           # Main logic
├── auth/             # Google API authentication
├── calendar/         # Google Calendar operations
├── tasks/            # Google Tasks operations
├── dispatch/         # GitHub repository dispatch
└── utils/            # Utility functions
__tests__/            # Unit tests
dist/                 # Bundled output (generated)
```

### Available Scripts

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format:write

# Bundle for distribution
npm run bundle

# Full build (lint + test + bundle)
npm run all
```

### Code Style

This project uses:

- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** for type safety

Run `npm run format:write` before committing to ensure consistent formatting.

### Writing Code

1. **TypeScript**: All source code should be in TypeScript
2. **Types**: Use explicit types, avoid `any`
3. **JSDoc**: Document public functions with JSDoc comments
4. **Error Handling**: Use try-catch and handle errors gracefully
5. **Logging**: Use `@actions/core` for logging (`core.info`, `core.warning`,
   `core.error`)

### Writing Tests

- Tests are located in `__tests__/`
- Use Jest for testing
- Aim for high test coverage
- Test both success and error cases
- Use mocks for external dependencies (Google APIs, GitHub APIs)

Example test structure:

```typescript
import { myFunction } from '../src/utils/my-module'

describe('myFunction', () => {
  it('should handle normal case', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })

  it('should handle edge case', () => {
    const result = myFunction('')
    expect(result).toBe('default')
  })
})
```

## Making Changes

### Commit Messages

Use clear, descriptive commit messages:

- `feat: add support for recurring events`
- `fix: handle empty calendar response`
- `docs: update authentication guide`
- `test: add tests for marker utilities`
- `refactor: simplify event type extraction`

### Pull Request Process

1. **Update tests**: Add or update tests for your changes
2. **Run checks**: Ensure all checks pass:

   ```bash
   npm run all
   ```

3. **Update documentation**: Update README.md if adding features
4. **Bundle**: Run `npm run bundle` to update `dist/`
5. **Create PR**: Submit a pull request with:
   - Clear title and description
   - Link to related issues
   - Summary of changes

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format:write`)
- [ ] `dist/` is updated (`npm run bundle`)
- [ ] Documentation is updated (if applicable)
- [ ] Version is bumped in `package.json` (if applicable)

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Testing Locally

### With `@github/local-action`

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in the required values in `.env`

3. Run locally:

   ```bash
   npx @github/local-action run .
   ```

### Manual Testing

Create a test workflow in a test repository:

```yaml
name: Test Action
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: your-username/google-calendar-dispatch-action@your-branch
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          google-credentials: ${{ secrets.GOOGLE_CREDENTIALS }}
          calendar-ids: 'primary'
```

## Questions?

If you have questions, feel free to:

- Open an issue for discussion
- Ask in the pull request

Thank you for contributing!
