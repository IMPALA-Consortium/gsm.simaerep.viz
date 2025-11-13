# API Reference

Complete API documentation for all charts in gsm.simaerep.viz.

## Available Charts

### SiteList

Interactive list-based visualization of clinical trial sites with selection capabilities.

#### Constructor

```javascript
new SiteList(container, data, config)
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `container` | HTMLElement | Yes | DOM element to render chart in |
| `data` | Array | Yes | Array of site objects with GroupID property |
| `config` | Object | No | Configuration object |

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `selectedGroupIDs` | String | `'None'` | Initially selected site ID |
| `maxHeight` | String | `'600px'` | Maximum height for list (CSS units) |
| `showGroupSelector` | Boolean | `true` | Show dropdown selector |
| `groupLabelKey` | String | `'GroupID'` | Property to use for site labels |

#### Data Structure

Required data format for SiteList:

```javascript
[
  {
    GroupID: string,              // Required: Unique site identifier
    InvestigatorLastName: string, // Optional: Investigator surname
    Country: string,              // Optional: Site country
    Status: string,               // Optional: Site status (Active, Inactive, etc.)
    SubjectCount: number,         // Optional: Number of enrolled subjects
    StudyID: string,              // Optional: Study identifier
    SiteNumber: number            // Optional: Site number within study
  }
]
```

**Required Fields:**
- `GroupID` - Must be present and unique for each site

**Optional Fields:**
- All other fields are optional but enhance the display
- Additional custom fields are preserved and accessible

#### Methods

##### `helpers.updateConfig(chart, newConfig, thresholds)`

Updates chart configuration and re-renders with new settings.

**Parameters:**
- `chart` - Chart instance
- `newConfig` - New configuration object
- `thresholds` - Statistical thresholds object

**Example:**
```javascript
chart.helpers.updateConfig(chart, {
  selectedGroupIDs: 'S0001',
  maxHeight: '400px'
}, {});
```

##### `helpers.updateSelectedGroupIDs(groupID)`

Updates the selected site and re-renders the chart with highlighting.

**Parameters:**
- `groupID` - Site ID to select (GroupID value)

**Example:**
```javascript
chart.helpers.updateSelectedGroupIDs('S0001');
```

#### Properties

Charts expose the following properties for integration:

##### `chart.data`

Contains chart data and configuration:

```javascript
{
  config: {
    selectedGroupIDs: string,  // Currently selected site
    maxHeight: string,
    showGroupSelector: boolean,
    groupLabelKey: string
  },
  _thresholds_: object  // Statistical thresholds
}
```

##### `canvas.chart`

Chart instance is attached to the canvas element for gsm.kri integration:

```javascript
const canvas = container.querySelector('canvas');
canvas.chart  // Returns the chart instance
```

## Usage Examples

### Basic Usage (Browser UMD)

```html
<div id="chart-container"></div>

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

### ES6 Module Usage

```javascript
import { SiteList } from 'gsm.simaerep.viz';

const sites = [
  { GroupID: 'S0001', InvestigatorLastName: 'Smith', Country: 'USA' },
  { GroupID: 'S0002', InvestigatorLastName: 'Jones', Country: 'UK' },
];

const container = document.getElementById('chart-container');
const chart = new SiteList(container, sites, {
  selectedGroupIDs: 'None',
  maxHeight: '500px',
  showGroupSelector: true
});
```

### Dynamic Updates

```javascript
// Create chart
const chart = new gsmSimaerepViz.SiteList(container, sites);

// Update selection programmatically
chart.helpers.updateSelectedGroupIDs('S0001');

// Update configuration
chart.helpers.updateConfig(chart, {
  selectedGroupIDs: 'S0002',
  maxHeight: '400px'
}, {});
```

### Integration with Selectors

```javascript
// Create chart
const chart = new gsmSimaerepViz.SiteList(container, sites, {
  showGroupSelector: true
});

// Get the selector element
const select = container.querySelector('.gsm-widget-control--group');

// Listen to changes
select.addEventListener('change', (e) => {
  console.log('Selected site:', e.target.value);
});
```

## Browser Compatibility

Charts are compatible with modern browsers supporting ES6+:

- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 15+

## Dependencies

- **gsm.viz** - Base visualization library (includes Chart.js bundled within)
  - Chart.js is externalized in this project's webpack config but provided by gsm.viz at runtime

## Related Documentation

- [Integration Guide](INTEGRATION.md) - gsm.kri integration details
- [Data Structures](DATA.md) - Data format specifications
- [SiteList Integration](charts/SiteList-Integration.md) - htmlwidget templates for gsm.simaerep

