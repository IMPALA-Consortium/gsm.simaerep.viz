# gsm.simaerep.viz

Web-based data visualization library for simaerep clinical trial monitoring data with integrated site selection functionality.

## Overview

`gsm.simaerep.viz` is a JavaScript visualization library designed to work seamlessly with the gsm.kri R package for risk-based quality monitoring in clinical trials. It provides interactive charts that support cross-widget site selection.

## Features

- **Site List Chart** - Interactive list-based visualization of clinical trial sites
- **gsm.viz Integration** - Compatible with gsm.viz site selection functionality
- **Cross-Widget Selection** - Site selection syncs across all widgets in reports
- **htmlwidgets Ready** - Designed for R htmlwidgets integration
- **Extensible** - Modular architecture for adding new chart types

## Installation

### For Contributors

```bash
git clone https://github.com/Gilead-BioStats/gsm.simaerep.viz.git
cd gsm.simaerep.viz
npm install
```

### As NPM Dependency

```bash
npm install github:Gilead-BioStats/gsm.simaerep.viz
```

## Quick Start

### In Browser (UMD)

```html
<script src="path/to/index.js"></script>
<script>
  const sites = [
    { GroupID: 'S0001', InvestigatorLastName: 'Smith', Country: 'USA' },
    { GroupID: 'S0002', InvestigatorLastName: 'Jones', Country: 'UK' },
  ];

  const container = document.getElementById('chart-container');
  const chart = new gsmSimaerepViz.SiteList(container, sites, {
    selectedGroupIDs: 'None',
    maxHeight: '500px',
    showGroupSelector: true
  });
</script>
```

### As ES6 Module

```javascript
import { SiteList } from 'gsm.simaerep.viz';

const sites = [
  { GroupID: 'S0001', InvestigatorLastName: 'Smith', Country: 'USA' },
  { GroupID: 'S0002', InvestigatorLastName: 'Jones', Country: 'UK' },
];

const chart = new SiteList(container, sites, {
  selectedGroupIDs: 'None',
  maxHeight: '500px',
  showGroupSelector: true
});
```

## Available Charts

### SiteList

Displays a list of clinical trial sites with selection capabilities.

**Parameters:**
- `container` - DOM element to render chart in
- `data` - Array of site objects with GroupID property
- `config` - Configuration object (optional)
  - `selectedGroupIDs` - Initially selected site (default: 'None')
  - `maxHeight` - Maximum height for list (default: '600px')
  - `showGroupSelector` - Show dropdown selector (default: true)
  - `groupLabelKey` - Property to use for site labels (default: 'GroupID')

**Required Data Structure:**
```javascript
[
  {
    GroupID: string,           // Required
    InvestigatorLastName: string, // Optional
    Country: string,           // Optional
    // ... other properties
  }
]
```

## gsm.kri Integration

Charts implement required interfaces for gsm.kri report interactivity:

### Required Properties

```javascript
// Chart instance attached to canvas
canvas.chart = chartInstance;

// Configuration with selected group
chart.data.config.selectedGroupIDs = 'Site001';

// Thresholds for statistical bounds
chart.data._thresholds_ = {};
```

### Required Methods

```javascript
// Update chart configuration
chart.helpers.updateConfig(chart, newConfig, thresholds);

// Update selected group IDs
chart.helpers.updateSelectedGroupIDs(groupID);
```

### Required CSS Classes

```html
<div class="gsm-widget site-list">
  <canvas></canvas>
  <select class="gsm-widget-control--group">
    <!-- options -->
  </select>
</div>
```

## Data Management

### Updating Example Data

Example data is stored in CSV format (like gsm.viz) and converted to JSON:

1. Edit CSV files in `examples/data/` (e.g., `sites.csv`)
2. Convert to JSON:
   ```bash
   node examples/data/helpers/csv-to-json.js
   ```

### Data Structure

Site data follows the gsm.viz pattern with these fields:

```javascript
{
  GroupID: string,           // Required: Unique site identifier
  InvestigatorLastName: string, // Investigator surname
  Country: string,           // Site country
  Status: string,            // Site status (Active, Inactive, etc.)
  SubjectCount: number,      // Number of enrolled subjects
  StudyID: string,           // Study identifier
  SiteNumber: number         // Site number within study
}
```

## Development

### Available NPM Scripts

```bash
npm run build    # Build production bundle
npm run bundle   # Build development bundle
npm run watch    # Auto-rebuild on changes
npm run test     # Run Jest tests
npm run local    # Start local dev server (port 8080)
```

### Development Workflow

1. **Make changes** to files in `./src` directory
2. **Bundle changes**: `npm run bundle`
3. **Run tests**: `npm run test`
4. **View examples**: `npm run local` then navigate to `http://localhost:8080/examples/`

### Live Development

Terminal 1:
```bash
npm run watch
```

Terminal 2:
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
│   │   └── sites.json
│   └── siteList.html     # Demo page
├── .github/
│   └── workflows/        # CI/CD configuration
├── index.js              # Built bundle (generated)
├── index.js.map          # Source map (generated)
└── package.json
```

## Contributing

### Branch Strategy

- **main** - Production-ready code
- **feature branches** - Named after issues (e.g., `feature-123`)

### Contribution Process

1. Create issue for new feature/bugfix
2. Create branch: `git checkout -b feature-123`
3. Make changes in `./src`
4. Run tests: `npm test`
5. Bundle: `npm run bundle`
6. Build: `npm run build`
7. Commit: `git commit -a -m 'fix #123'`
8. Push: `git push -u origin feature-123`
9. Open Pull Request to `main`
10. Ensure CI/CD passes
11. Merge after review

## Code Standards

- **Formatting**: Prettier (`.prettierrc.json`)
- **Transpilation**: Babel ES6+
- **Testing**: Jest with jsdom
- **Module Pattern**: One function/class per file in `./src`

## Dependencies

- **gsm.viz** - Base visualization library (GitHub)
- **Chart.js** - Charting library (via gsm.viz)

## Development Dependencies

- **Babel** - ES6+ transpilation
- **Jest** - Unit testing framework
- **Webpack** - Module bundling
- **Prettier** - Code formatting

## Browser Compatibility

Modern browsers supporting ES6+:
- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 15+

## License

MIT License - see [LICENSE.md](LICENSE.md) for full text.

Copyright (c) 2025 IMPALA Consortium

## Related Projects

- [gsm.viz](https://github.com/Gilead-BioStats/gsm.viz) - Base visualization library
- [gsm.kri](https://github.com/Gilead-BioStats/gsm.kri) - R package for KRI reporting
- [gsm.core](https://github.com/Gilead-BioStats/gsm.core) - Core utilities

## Support

For issues and questions, please open an issue on GitHub.

