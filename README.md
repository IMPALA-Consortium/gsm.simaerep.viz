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
git clone https://github.com/IMPALA-Consortium/gsm.simaerep.viz.git
cd gsm.simaerep.viz
npm install
```

### As NPM Dependency

```bash
npm install github:IMPALA-Consortium/gsm.simaerep.viz
```

## Quick Start

### Browser (UMD)

```html
<script src="path/to/index.js"></script>
<script>
  const sites = [
    { GroupID: 'S0001', InvestigatorLastName: 'Smith', Country: 'USA' },
    { GroupID: 'S0002', InvestigatorLastName: 'Jones', Country: 'UK' },
  ];

  const chart = new gsmSimaerepViz.SiteList(
    document.getElementById('chart-container'),
    sites,
    { selectedGroupIDs: 'None', maxHeight: '500px' }
  );
</script>
```

### ES6 Module

```javascript
import { SiteList } from 'gsm.simaerep.viz';

const chart = new SiteList(container, sites, {
  selectedGroupIDs: 'None',
  maxHeight: '500px',
  showGroupSelector: true
});
```

## Available Charts

- **[SiteList](docs/API.md#sitelist)** - Interactive list of clinical trial sites with selection support

## Deploying to gsm.simaerep

This JavaScript library is used as an htmlwidget dependency in the [gsm.simaerep](https://github.com/Gilead-BioStats/gsm.simaerep) R package. After making changes and testing, deploy the updated bundle to gsm.simaerep using the following commands.

**Prerequisites:** Both `gsm.simaerep.viz` and `gsm.simaerep` repositories should be in the same parent directory.

### Build and Deploy

```bash
# Build production bundle
npm run build

# Create target directory if it doesn't exist
mkdir -p ../gsm.simaerep/inst/htmlwidgets/lib/gsm.simaerep.viz

# Copy bundle files and license to gsm.simaerep
cp index.js index.js.map LICENSE.md ../gsm.simaerep/inst/htmlwidgets/lib/gsm.simaerep.viz/
# Copy third-party license file if it exists (generated when Chart.js is bundled)
[ -f index.js.LICENSE.txt ] && cp index.js.LICENSE.txt ../gsm.simaerep/inst/htmlwidgets/lib/gsm.simaerep.viz/ || true
```

### Verify Deployment

```bash
# Check files were copied successfully
ls -la ../gsm.simaerep/inst/htmlwidgets/lib/gsm.simaerep.viz/
```

After deployment, test the htmlwidget integration in the gsm.simaerep R package to ensure the changes work as expected.

## Testing

Run tests with Jest:

```bash
npm test              # Run all tests
npm test -- --watch   # Run in watch mode
npm test -- --coverage # Generate coverage report
```

## Documentation

📚 **[Full Documentation →](docs/)**

- [API Reference](docs/API.md) - Complete chart APIs and parameters
- [Integration Guide](docs/INTEGRATION.md) - gsm.kri integration details
- [Data Structures](docs/DATA.md) - Data format specifications
- [SiteList Integration](docs/charts/SiteList-Integration.md) - htmlwidget templates for gsm.simaerep

## Contributing

🤝 **[Contributing Guide →](CONTRIBUTING.md)**

We welcome contributions! Please see our contributing guide for:
- Development workflow
- Git branch strategy
- Code standards
- Testing requirements

## Project Structure

```
gsm.simaerep.viz/
├── src/                    # Source modules
│   ├── SiteList.js        # Site list chart
│   └── index.js           # Main entry point
├── tests/                 # Jest tests
├── examples/              # Working examples
├── docs/                  # Documentation
├── index.js              # Built bundle (generated)
└── package.json
```

## Dependencies

- **Chart.js** - JavaScript charting library (bundled internally, not exposed in public API)

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

- [gsm.kri](https://github.com/Gilead-BioStats/gsm.kri) - R package for KRI reporting
- [gsm.simaerep](https://github.com/Gilead-BioStats/gsm.simaerep) - R package for simaerep analysis
- [gsm.core](https://github.com/Gilead-BioStats/gsm.core) - Core utilities

## Support

For issues and questions, please open an issue on [GitHub](https://github.com/IMPALA-Consortium/gsm.simaerep.viz/issues).
