# Data Structures

Complete guide to data formats, management, and conversion processes for gsm.simaerep.viz.

## Overview

gsm.simaerep.viz follows the data patterns established by gsm.viz, using JSON format for JavaScript consumption with CSV source files for easy editing.

## Site Data Structure

### Required Format

Site data must be provided as an array of objects with at minimum a `GroupID` field:

```javascript
[
  {
    GroupID: string,              // Required: Unique site identifier
    InvestigatorLastName: string, // Recommended: Investigator surname  
    Country: string,              // Recommended: Site country
    Status: string,               // Optional: Site status
    SubjectCount: number,         // Optional: Number of enrolled subjects
    StudyID: string,              // Optional: Study identifier
    SiteNumber: number            // Optional: Site number
    // ... additional fields allowed
  }
]
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `GroupID` | String | **Yes** | Unique identifier for the site. Used for selection and highlighting. |
| `InvestigatorLastName` | String | No | Principal investigator's surname. Enhances site identification. |
| `Country` | String | No | Site location country. Used for country-level filtering. |
| `Status` | String | No | Site status (e.g., "Active", "Inactive", "Recruiting"). |
| `SubjectCount` | Number | No | Number of subjects enrolled at the site. |
| `StudyID` | String | No | Study identifier if multiple studies present. |
| `SiteNumber` | Number | No | Numeric site identifier within study. |

**Additional Fields:** Custom fields are preserved and accessible but not used by default visualizations.

### Example Data

```javascript
const sites = [
  {
    GroupID: "S0001",
    InvestigatorLastName: "Smith",
    Country: "USA",
    Status: "Active",
    SubjectCount: 45,
    StudyID: "STUDY-001",
    SiteNumber: 1
  },
  {
    GroupID: "S0002",
    InvestigatorLastName: "Jones",
    Country: "UK",
    Status: "Active",
    SubjectCount: 38,
    StudyID: "STUDY-001",
    SiteNumber: 2
  },
  {
    GroupID: "S0003",
    InvestigatorLastName: "Brown",
    Country: "Canada",
    Status: "Inactive",
    SubjectCount: 12,
    StudyID: "STUDY-001",
    SiteNumber: 3
  }
];
```

## Data Management Workflow

### Source Files

Example data is stored in CSV format for easy editing:

```
examples/data/
├── sites.csv          # Source CSV file
├── sites.json         # Generated JSON file
└── helpers/
    └── csv-to-json.js # Conversion script
```

### CSV Format

The CSV file should have headers matching the field names:

```csv
GroupID,InvestigatorLastName,Country,Status,SubjectCount,StudyID,SiteNumber
S0001,Smith,USA,Active,45,STUDY-001,1
S0002,Jones,UK,Active,38,STUDY-001,2
S0003,Brown,Canada,Inactive,12,STUDY-001,3
```

**Guidelines:**
- First row must be headers
- Headers should match JSON field names exactly
- Use consistent formatting (no extra spaces)
- Empty fields are allowed (will be null/empty in JSON)

### Converting CSV to JSON

After editing CSV files, convert to JSON for use in examples:

```bash
# From project root
node examples/data/helpers/csv-to-json.js
```

**What it does:**
- Reads all `.csv` files in `examples/data/`
- Converts each to corresponding `.json` file
- Preserves data types (numbers, strings)
- Formats JSON for readability

**Output:**

```json
[
  {
    "GroupID": "S0001",
    "InvestigatorLastName": "Smith",
    "Country": "USA",
    "Status": "Active",
    "SubjectCount": 45,
    "StudyID": "STUDY-001",
    "SiteNumber": 1
  },
  {
    "GroupID": "S0002",
    "InvestigatorLastName": "Jones",
    "Country": "UK",
    "Status": "Active",
    "SubjectCount": 38,
    "StudyID": "STUDY-001",
    "SiteNumber": 2
  }
]
```

## Data Validation

### Required Validations

Charts should validate data on instantiation:

```javascript
constructor(container, data, config) {
  // Check data is array
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  // Check for GroupID in each record
  const missingGroupID = data.some(d => !d.GroupID);
  if (missingGroupID) {
    throw new Error('All data records must have a GroupID field');
  }
  
  // Check for duplicates
  const groupIDs = data.map(d => d.GroupID);
  const duplicates = groupIDs.filter((id, index) => groupIDs.indexOf(id) !== index);
  if (duplicates.length > 0) {
    console.warn('Duplicate GroupIDs found:', duplicates);
  }
  
  this.rawData = data;
}
```

### Recommended Checks

Additional validations for robustness:

- Empty data array (show message)
- Unexpected field types (coerce or warn)
- Missing recommended fields (use defaults)
- Special characters in GroupID (sanitize for DOM)

## Data Access Patterns

### Filtering Data

```javascript
// Filter by country
const usaSites = data.filter(d => d.Country === 'USA');

// Filter by status
const activeSites = data.filter(d => d.Status === 'Active');

// Find by GroupID
const site = data.find(d => d.GroupID === 'S0001');
```

### Extracting Unique Values

```javascript
// Get all unique countries
const countries = [...new Set(data.map(d => d.Country))];

// Get all unique GroupIDs
const groupIDs = [...new Set(data.map(d => d.GroupID))];

// Get all unique statuses
const statuses = [...new Set(data.map(d => d.Status))];
```

### Sorting Data

```javascript
// Sort by InvestigatorLastName
data.sort((a, b) => 
  (a.InvestigatorLastName || '').localeCompare(b.InvestigatorLastName || '')
);

// Sort by SubjectCount (descending)
data.sort((a, b) => (b.SubjectCount || 0) - (a.SubjectCount || 0));

// Sort by Country then InvestigatorLastName
data.sort((a, b) => {
  const countryCompare = (a.Country || '').localeCompare(b.Country || '');
  if (countryCompare !== 0) return countryCompare;
  return (a.InvestigatorLastName || '').localeCompare(b.InvestigatorLastName || '');
});
```

## Data Updates

### Handling Dynamic Data

Charts should support data updates:

```javascript
updateData(newData) {
  // Validate new data
  if (!Array.isArray(newData)) {
    throw new Error('Data must be an array');
  }
  
  // Update raw data
  this.rawData = newData;
  
  // Update selector if needed
  if (this.selector) {
    this.rebuildSelector();
  }
  
  // Re-render
  this.render();
}
```

### Incremental Updates

For performance with large datasets:

```javascript
addSite(site) {
  // Validate site has GroupID
  if (!site.GroupID) {
    throw new Error('Site must have GroupID');
  }
  
  // Add to data
  this.rawData.push(site);
  
  // Add to selector without full rebuild
  if (this.selector) {
    const option = document.createElement('option');
    option.value = site.GroupID;
    option.textContent = site.GroupID;
    this.selector.appendChild(option);
  }
  
  // Re-render
  this.render();
}

removeSite(groupID) {
  // Remove from data
  this.rawData = this.rawData.filter(d => d.GroupID !== groupID);
  
  // Remove from selector
  if (this.selector) {
    const option = this.selector.querySelector(`option[value="${groupID}"]`);
    if (option) option.remove();
  }
  
  // If removed site was selected, reset selection
  if (this.data.config.selectedGroupIDs === groupID) {
    this.updateSelectedGroupIDs('None');
  }
  
  // Re-render
  this.render();
}
```

## Best Practices

### Data Immutability

Avoid mutating the original data array:

```javascript
// Good: Create filtered copy
const filtered = this.rawData.filter(d => d.Status === 'Active');

// Bad: Mutate original
this.rawData = this.rawData.filter(d => d.Status === 'Active');
```

### Default Values

Provide sensible defaults for missing fields:

```javascript
render() {
  this.rawData.forEach(site => {
    const label = site.InvestigatorLastName || site.GroupID;
    const country = site.Country || 'Unknown';
    const status = site.Status || 'Unknown';
    // ... use values
  });
}
```

### Performance Considerations

For large datasets:
- Cache computed values (unique lists, filtered data)
- Use efficient array methods (map, filter vs loops)
- Debounce expensive operations (search, filter)
- Consider virtual scrolling for very long lists

## Related Documentation

- [API Reference](API.md) - Chart APIs and parameters
- [Integration Guide](INTEGRATION.md) - gsm.kri integration details
- [SiteList Integration](charts/SiteList-Integration.md) - htmlwidget templates


