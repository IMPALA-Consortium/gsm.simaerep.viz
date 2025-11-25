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

---

### Simaerep

Time series visualization showing cumulative deviation trends across clinical trial sites over time. Displays study-level reference lines alongside flagged and unflagged sites with interactive selection capabilities.

#### Constructor

```javascript
new Simaerep(container, data, config)
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `container` | HTMLElement | Yes | DOM element to render chart in |
| `data` | Object | Yes | Data object containing time series datasets |
| `config` | Object | No | Configuration object |

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `selectedGroupIDs` | String | `'None'` | Initially selected site ID |
| `width` | String | `'100%'` | Chart width (CSS units) |
| `height` | String | `'auto'` | Chart height (CSS units) |
| `aspectRatio` | Number | `2` | Chart aspect ratio when height is auto |
| `showGroupSelector` | Boolean | `true` | Show dropdown selector |
| `groupLabelKey` | String | `'GroupID'` | Property to use for site labels |
| `GroupLevel` | String | `'Site'` | Group level (Site, Country, etc.) |
| `groupMetadata` | Array | `null` | Optional metadata for tooltip enrichment |
| **KRI Metadata** | | | **For dynamic chart labels** |
| `metric` | Object | `undefined` | **Recommended:** Metric metadata object with all KRI fields |
| *Individual Fields* | | | *Backwards compatible (use metric object instead):* |
| `Metric` | String | `'Adverse Event Rate'` | Full metric name |
| `Numerator` | String | `'Adverse Events'` | Numerator description |
| `Denominator` | String | `'Visits'` | Denominator description (used for x-axis label) |
| `Score` | String | `'Over/Under-Reporting Probability'` | Score type description |
| `ExpectedNumerator` | String | `'Delta Expected AEs'` | Expected numerator description |
| `Abbreviation` | String | `'AE'` | Short metric abbreviation |

#### KRI Metadata Integration

The Simaerep chart uses KRI metadata fields to dynamically configure axis labels and tooltip content, following the same pattern as gsm.viz.

**Recommended Approach:** Pass the entire metric object from `df_metric`:

```javascript
const chart = new Simaerep(container, data, {
  metric: df_metric[0]  // Pass entire metric row - clean and simple!
});
```

This automatically extracts all fields: `Metric`, `Numerator`, `Denominator`, `Score`, `ExpectedNumerator`, `Abbreviation`, `GroupLevel`.

**R Package Integration:**
```r
Widget_Simaerep(
  df_mean_study = df_mean_study,
  df_mean_group_flagged = df_mean_group_flagged,
  df_mean_group_not_flagged = df_mean_group_not_flagged,
  df_label_sites = df_label_sites,
  df_groups = df_groups,
  metric = df_metric[1,],  # Just pass the row!
  selectedGroupIDs = 'None'
)
```

**Backwards Compatible:** Individual fields still work:

```javascript
const chart = new Simaerep(container, data, {
  Metric: 'Adverse Event Rate',
  Numerator: 'Adverse Events',
  Denominator: 'Visits',
  Score: 'Over/Under-Reporting Probability'
});
```

**Field Priority:** `metric` object fields > individual config fields > defaults

#### Data Structure

Required data format for Simaerep:

```javascript
{
  df_mean_study: [           // Study-level reference line
    {
      Denominator: number,   // X-axis value
      cum_mean_dev_event: number  // Y-axis value
    }
  ],
  df_mean_group_flagged: [   // Flagged sites with anomalies
    {
      GroupID: string,       // Site identifier
      Denominator: number,
      cum_mean_dev_event: number
    }
  ],
  df_mean_group_not_flagged: [  // Normal sites
    {
      GroupID: string,
      Denominator: number,
      cum_mean_dev_event: number
    }
  ],
  df_label_sites: [          // Site metadata for colors
    {
      GroupID: string,
      Color: string          // Hex color code
    }
  ],
  df_groups: [               // Optional: Extended metadata for tooltips
    {
      GroupID: string,
      GroupLevel: string,
      InvestigatorLastName: string,
      Country: string,
      // ... additional metadata fields
    }
  ]
}
```

**Required Datasets:**
- `df_mean_study` - Study reference line
- `df_mean_group_flagged` - Flagged site trajectories
- `df_mean_group_not_flagged` - Normal site trajectories
- `df_label_sites` - Site color mappings

**Optional Datasets:**
- `df_groups` - Extended metadata for tooltip enrichment

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
  aspectRatio: 1.5
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
    width: string,
    height: string,
    aspectRatio: number,
    Metric: string,            // KRI metric name
    Denominator: string,       // Denominator label
    // ... other config options
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

---

## Usage Examples

### SiteList Chart

#### Basic Usage (Browser UMD)

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

### Simaerep Chart

#### Basic Usage (Browser UMD)

```html
<div id="chart-container"></div>

<script src="path/to/index.js"></script>
<script>
  const data = {
    df_mean_study: [...],
    df_mean_group_flagged: [...],
    df_mean_group_not_flagged: [...],
    df_label_sites: [...],
    df_groups: [...],
    df_metric: [...]
  };

  const container = document.getElementById('chart-container');
  const chart = new gsmSimaerepViz.Simaerep(container, data, {
    selectedGroupIDs: 'None',
    aspectRatio: 1.5,
    showGroupSelector: true,
    metric: data.df_metric[0]  // Pass entire metric object
  });
</script>
```

#### ES6 Module Usage

```javascript
import { Simaerep } from 'gsm.simaerep.viz';

const chart = new Simaerep(container, data, {
  selectedGroupIDs: 'None',
  aspectRatio: 1.5,
  showGroupSelector: true,
  groupMetadata: df_groups,
  metric: df_metric[0]  // Pass entire metric object
});
```

#### Dynamic Updates

```javascript
// Create chart
const chart = new gsmSimaerepViz.Simaerep(container, data);

// Update selection programmatically
chart.helpers.updateSelectedGroupIDs('S0001');

// Update configuration
chart.helpers.updateConfig(chart, {
  selectedGroupIDs: 'S0002',
  aspectRatio: 2
}, {});
```

#### Integration with Selectors

```javascript
// Create chart
const chart = new gsmSimaerepViz.Simaerep(container, data, {
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

