# gsm.viz Research Summary

## Project Overview

**Repository:** https://github.com/Gilead-BioStats/gsm.viz  
**License:** Apache-2.0  
**Primary Purpose:** Web-based data visualization library for risk-based monitoring in clinical trials  
**Built With:** Chart.js  
**Live Examples:** 
- Production: https://gilead-biostats.github.io/gsm.viz/
- Development: Available in repository

## Key Features

### Available Visualization Modules

1. **Scatter Plot** - For displaying relationship between variables
2. **Bar Chart** - For categorical data comparison
3. **Time Series** - For temporal data visualization
4. **Sparkline** - For compact trend visualization
5. **Site Overview** - Aggregated site-level monitoring data
6. **Country Overview** - Aggregated country-level monitoring data

## Project Statistics

- **Stars:** 2
- **Forks:** 1
- **Watchers:** 6
- **Contributors:** 12
- **Language:** JavaScript 100%
- **Total Commits:** 708
- **Open Issues:** 34
- **Pull Requests:** 1
- **Releases:** 38 (Latest: v2.2.0, March 6, 2025)

## Repository Structure

```
gsm.viz/
├── .github/workflows/    # CI/CD automation
├── examples/             # Working examples of modules
│   └── data/            # Example datasets (CSV format)
│       └── helpers/     # Data conversion utilities
├── src/                 # Source code (modules)
├── tests/               # Unit tests
├── .gitignore
├── .prettierignore      # Code formatting exclusions
├── .prettierrc.json     # Prettier configuration
├── LICENSE              # Apache-2.0
├── README.md
├── babel.config.json    # Babel transpiler config
├── index.js             # Main entry point
├── index.js.map         # Source map
├── jest.config.js       # Jest testing configuration
├── package.json         # NPM dependencies
└── package-lock.json    # Locked dependencies
```

## Installation

### For Users

```bash
npm install git+https://github.com/Gilead-BioStats/gsm.viz.git
```

### For Contributors

```bash
git clone https://github.com/Gilead-BioStats/gsm.viz.git
cd gsm.viz
npm install
```

## Development Workflow

### Version Control Strategy

- **Main Branch:** `dev` (development branch)
- **Feature Branches:** Named after issues (e.g., `fix-123` for issue #123)
- **Pull Requests:** Required code review before merging to `dev`

### Development Process

1. **Create Feature Branch:**
   ```bash
   git checkout -b fix-123
   ```

2. **Make Changes** to files in `./src` directory
   - Each file should contain a single function/module

3. **Bundle Changes:**
   ```bash
   npm run bundle
   ```

4. **Build and Commit:**
   ```bash
   npm run build
   git add -A
   git commit -a -m 'fix #123'
   git push -u origin fix-123
   ```

5. **Open Pull Request** on GitHub (source: feature branch, target: `dev`)

### Available NPM Scripts

- `npm run bundle` - Bundle the library after updates
- `npm run build` - Full build of the library
- `npm run test` - Run unit tests (Jest)
- `npm run watch` - Auto-bundle on file changes (development)
- `npm run local` - Start local server to view examples

### Advanced Development

**Live Development Setup:**

Terminal 1:
```bash
npm run watch
```

Terminal 2:
```bash
npm run local
```

Then navigate to `./examples` in browser to see real-time changes.

## Data Management

### Updating Example Data

1. Edit CSV files in `examples/data/`
2. Convert to JSON:
   ```bash
   node examples/data/helpers/csv-to-json.js
   ```

## Testing

- **Framework:** Jest
- **Configuration:** `jest.config.js`
- **Run Tests:**
  ```bash
  npm run test
  ```

## Code Standards

- **Formatting:** Prettier (configured in `.prettierrc.json`)
- **Transpilation:** Babel (configured in `babel.config.json`)
- **Module Pattern:** One function/module per file in `./src`

## Technical Stack

### Core Technologies
- **Chart.js** - Base charting library
- **JavaScript** - Primary language
- **Babel** - ES6+ transpilation
- **Jest** - Unit testing
- **Prettier** - Code formatting

### Build Process
1. Source code in `./src`
2. Babel transpilation
3. Bundling to `index.js`
4. Source map generation (`index.js.map`)

## Use Case: Risk-Based Monitoring

The library is specifically designed for **risk-based monitoring in clinical trials**, which involves:
- Monitoring site performance metrics
- Identifying outliers and trends
- Country and site-level aggregations
- Real-time visualization of clinical trial data
- Quality control and compliance tracking

## Key Considerations for Similar Projects

1. **Modular Architecture** - Each visualization is a separate module
2. **Example-Driven Development** - Working examples for each module
3. **Data Flexibility** - Supports CSV-to-JSON conversion
4. **Real-time Development** - Watch mode for rapid iteration
5. **Browser-Based** - Can be viewed locally during development
6. **Chart.js Foundation** - Leverages existing robust charting library
7. **Clinical Trial Focus** - Domain-specific visualizations for healthcare/pharma

## Related Links

- **Website:** https://gilead-biostats.github.io/gsm.viz/
- **Repository:** https://github.com/Gilead-BioStats/gsm.viz
- **Chart.js Documentation:** https://www.chartjs.org/

## Notes for Implementation

When creating a similar project (gsm.simaerep.viz):

1. Consider same modular approach (one module per file)
2. Use Chart.js as base library for consistency
3. Maintain example directory with working demos
4. Implement CSV-to-JSON conversion for data flexibility
5. Use Jest for testing framework
6. Implement watch/local development workflow
7. Consider similar visualization modules adapted to specific domain needs
8. Maintain clear separation between source (`src/`) and examples (`examples/`)
9. Use Babel for modern JavaScript features
10. Include comprehensive README with installation and contribution guidelines


