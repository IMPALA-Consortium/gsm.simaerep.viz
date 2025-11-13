# Contributing to gsm.simaerep.viz

Thank you for your interest in contributing to gsm.simaerep.viz! This document provides guidelines and workflows for contributors.

## Development Setup

### Prerequisites

- Node.js and npm installed
- Git for version control
- Text editor or IDE

### Installation

```bash
git clone https://github.com/IMPALA-Consortium/gsm.simaerep.viz.git
cd gsm.simaerep.viz
npm install
```

## Development Workflow

### Available NPM Scripts

```bash
npm run build    # Build production bundle
npm run bundle   # Build development bundle
npm run watch    # Auto-rebuild on changes
npm run test     # Run Jest tests
npm run local    # Start local dev server (port 8080)
```

### Standard Development Process

1. **Make changes** to files in `./src` directory
2. **Bundle changes**: `npm run bundle`
3. **Run tests**: `npm run test`
4. **View examples**: `npm run local` then navigate to `http://localhost:8080/examples/`

### Live Development

For active development with automatic rebuilding:

**Terminal 1:**
```bash
npm run watch
```

**Terminal 2:**
```bash
npm run local
```

Open examples in browser:
- `http://localhost:8080/examples/siteList.html` - Full-featured demo
- `http://localhost:8080/examples/siteList-simple.html` - Simple test (can also open directly without server)

## Testing

Tests use Jest with jsdom for DOM testing.

```bash
npm test              # Run all tests
npm test -- --watch   # Run in watch mode
npm test -- --coverage # Generate coverage report
```

All tests must pass before submitting a pull request.

## Git Workflow

We use a feature branch workflow with GitHub issues.

### Branch Strategy

- **main** - Production-ready code
- **feature branches** - Named after issues (e.g., `5_deploy_docs`)

### Contribution Process

1. **Create or find an issue** describing the feature/bugfix
2. **Create branch**: `git checkout -b <issue-number>_<short-description>`
   - Example: `git checkout -b 5_deploy_docs`
3. **Make changes** in `./src` directory
4. **Run tests**: `npm test`
5. **Bundle**: `npm run bundle`
6. **Build**: `npm run build` (production)
7. **Commit**: `git commit -a -m 'fix #<issue-number> - description'`
8. **Push**: `git push -u origin <branch-name>`
9. **Open Pull Request** to `main` branch
10. **Ensure CI/CD passes**
11. **Code review and merge** after approval

### Commit Guidelines

- Reference issue numbers: `fix #123`, `closes #456`
- Keep commits focused and atomic
- Write clear commit messages
- Never commit with `--no-verify` unless explicitly necessary

### Important Notes

- **Never commit and push without review** - User manages final commits and pushes
- **Never force push** to main/master branches
- **Never skip hooks** (--no-verify) unless explicitly requested
- **Never copy code** to gsm.simaerep - user handles integration

## Code Standards

### Formatting
- **Prettier** configuration in `.prettierrc.json`
- Run automatically on commit (pre-commit hook)

### Transpilation
- **Babel** for ES6+ compatibility
- Configuration in `babel.config.json`

### Testing
- **Jest** with jsdom for DOM testing
- All new features require tests
- Maintain or improve test coverage

### Module Pattern
- One function/class per file in `./src`
- Export from `./src/index.js`
- Follow existing patterns in codebase

## Development Dependencies

The project uses:

- **Babel** - ES6+ transpilation
- **Jest** - Unit testing framework
- **Webpack** - Module bundling
- **Prettier** - Code formatting

## Project Structure

```
gsm.simaerep.viz/
├── src/                    # Source modules
│   ├── SiteList.js        # Site list chart
│   └── index.js           # Main entry point
├── tests/                 # Jest tests
│   └── SiteList.test.js
├── examples/              # Working examples
│   ├── data/             # Example data
│   └── *.html            # Demo pages
├── docs/                  # Documentation
├── index.js              # Built bundle (generated)
└── index.js.map          # Source map (generated)
```

## Adding New Chart Types

When adding a new chart type:

1. Create chart class in `src/{ChartType}.js`
2. Export from `src/index.js`
3. Add tests in `tests/{ChartType}.test.js`
4. Create example in `examples/`
5. Run `/add-chart-docs` command to generate integration documentation
6. Update API documentation in `docs/API.md`

## Questions or Problems?

- Open an issue on [GitHub](https://github.com/IMPALA-Consortium/gsm.simaerep.viz/issues)
- Check existing documentation in the `docs/` folder
- Review the main [README](README.md)

Thank you for contributing! 🎉


