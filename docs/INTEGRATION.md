# gsm.kri Integration Guide

This document describes how gsm.simaerep.viz charts integrate with gsm.kri reports to provide cross-widget site selection and interactive functionality.

## Overview

Charts in gsm.simaerep.viz are designed to work seamlessly with gsm.kri's report interactivity system. The gsm.kri R package includes JavaScript files (`overallGroupDropdown.js`, etc.) that enable:

- Global site/group selector across all charts in a report
- Cross-widget site selection synchronization
- Highlighted display of selected sites
- Individual chart selectors that sync with global selection

## Required Interfaces

For charts to work correctly in gsm.kri reports, they must implement specific interfaces that the gsm.kri JavaScript can interact with.

### 1. Canvas Attachment

**CRITICAL:** Chart instances must be attached to their canvas element:

```javascript
class MyChart {
  constructor(container, data, config) {
    this.canvas = document.createElement('canvas');
    container.appendChild(this.canvas);
    
    // CRITICAL: Attach chart instance to canvas
    this.canvas.chart = this;
    
    // ... rest of initialization
  }
}
```

**Why?** The gsm.kri scripts locate charts by finding `<canvas>` elements and accessing `canvas.chart` to call update methods.

### 2. Data Structure

Charts must expose a `data` object with configuration and thresholds:

```javascript
this.data = {
  config: {
    selectedGroupIDs: config.selectedGroupIDs || 'None',
    // ... other config options
  },
  _thresholds_: data.thresholds || {}
};
```

**Properties:**
- `data.config.selectedGroupIDs` - Currently selected site ID(s)
- `data._thresholds_` - Statistical thresholds (may be empty object)

### 3. Helper Methods

Charts must provide a `helpers` object with update methods:

```javascript
this.helpers = {
  updateConfig: this.updateConfig.bind(this),
  updateSelectedGroupIDs: this.updateSelectedGroupIDs.bind(this)
};
```

#### `updateConfig(chart, config, thresholds)`

Updates chart configuration and re-renders:

```javascript
updateConfig(chart, config, thresholds) {
  chart.data.config = config;
  chart.data._thresholds_ = thresholds;
  this.render();
}
```

**Called by:** gsm.kri's `overallClick()` for most chart types

#### `updateSelectedGroupIDs(groupID)`

Updates selected site and re-renders (simplified interface):

```javascript
updateSelectedGroupIDs(groupID) {
  this.data.config.selectedGroupIDs = groupID;
  this.render();
}
```

**Called by:** 
- gsm.kri's `overallClick()` for timeSeries widgets
- Local chart selectors

### 4. CSS Classes

Charts must use specific CSS classes for gsm.kri integration:

#### Widget Container

```html
<div class="gsm-widget {chart-type}">
  <!-- chart content -->
</div>
```

**Required:**
- `.gsm-widget` - Identifies widget containers for global selector
- `{chart-type}` - Chart-specific class (e.g., `site-list`, `timeSeries`)

#### Group Selector

```html
<select class="gsm-widget-control--group">
  <option>None</option>
  <option>Site001</option>
  <!-- ... -->
</select>
```

**Required:**
- `.gsm-widget-control--group` - Group/site selector dropdown
- Must be descendant of `.gsm-widget` container

#### Country Selector (Optional)

```html
<select class="gsm-widget-control--country">
  <option>None</option>
  <option>USA</option>
  <!-- ... -->
</select>
```

**Optional:**
- `.gsm-widget-control--country` - Country selector dropdown

### 5. Complete Implementation Example

```javascript
class SiteList {
  constructor(container, data, config = {}) {
    // Store references
    this.container = container;
    this.rawData = data;
    
    // Add widget classes
    this.container.classList.add('gsm-widget', 'site-list');
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    
    // CRITICAL: Attach to canvas
    this.canvas.chart = this;
    
    // Initialize data structure
    this.data = {
      config: {
        selectedGroupIDs: config.selectedGroupIDs || 'None',
        maxHeight: config.maxHeight || '600px',
        showGroupSelector: config.showGroupSelector !== false,
        groupLabelKey: config.groupLabelKey || 'GroupID'
      },
      _thresholds_: {}
    };
    
    // Bind helper methods
    this.helpers = {
      updateConfig: this.updateConfig.bind(this),
      updateSelectedGroupIDs: this.updateSelectedGroupIDs.bind(this)
    };
    
    // Create selector
    if (this.data.config.showGroupSelector) {
      this.createSelector();
    }
    
    // Initial render
    this.render();
  }
  
  createSelector() {
    const select = document.createElement('select');
    select.className = 'gsm-widget-control--group';
    select.innerHTML = '<option>None</option>';
    
    // Populate with group IDs
    const groupIDs = [...new Set(this.rawData.map(d => d.GroupID))];
    groupIDs.forEach(id => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = id;
      if (id === this.data.config.selectedGroupIDs) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    // Handle local selection
    select.addEventListener('change', (e) => {
      this.updateSelectedGroupIDs(e.target.value);
    });
    
    this.container.appendChild(select);
    this.selector = select;
  }
  
  updateConfig(chart, config, thresholds) {
    chart.data.config = config;
    chart.data._thresholds_ = thresholds;
    
    // Update selector if present
    if (this.selector) {
      this.selector.value = config.selectedGroupIDs;
    }
    
    this.render();
  }
  
  updateSelectedGroupIDs(groupID) {
    this.data.config.selectedGroupIDs = groupID;
    
    // Update selector if present
    if (this.selector) {
      this.selector.value = groupID;
    }
    
    this.render();
  }
  
  render() {
    // Render chart with selected site highlighted
    // Implementation specific to chart type
  }
}
```

## gsm.kri Script Interaction

### How Global Selection Works

1. **User selects site** in global dropdown (created by `overallGroupDropdown.js`)
2. **`overallClick()` triggered** - event handler in gsm.kri
3. **For each `.gsm-widget`:**
   - Find canvas element
   - Access `canvas.chart`
   - Check if timeSeries: call `updateSelectedGroupIDs()`
   - Otherwise: call `updateConfig()` with new config
4. **Charts re-render** with selected site highlighted
5. **Individual selectors sync** to match global selection

### Data Flow

```
Global Selector (overallGroupDropdown.js)
  ↓ User clicks
overallClick() Event Handler
  ↓ Queries
.gsm-widget Containers
  ↓ For each widget
canvas.chart Object
  ↓ Calls
chart.helpers.updateConfig() OR updateSelectedGroupIDs()
  ↓ Updates
chart.data.config.selectedGroupIDs
  ↓ Triggers
Chart Re-render
  ↓ Updates
Individual Selector (.gsm-widget-control--group)
```

## Testing Integration

### Manual Testing Checklist

When implementing a new chart, verify:

- [ ] Chart has `.gsm-widget` class on container
- [ ] Canvas element created and chart attached: `canvas.chart`
- [ ] `chart.data.config.selectedGroupIDs` property exists
- [ ] `chart.helpers.updateConfig()` method works
- [ ] `chart.helpers.updateSelectedGroupIDs()` method works
- [ ] Selector has `.gsm-widget-control--group` class
- [ ] Local selector updates trigger re-render
- [ ] Selected site is visually highlighted in chart

### Browser Console Testing

```javascript
// Find widget
const widget = document.querySelector('.gsm-widget.site-list');
const canvas = widget.querySelector('canvas');
const chart = canvas.chart;

// Verify structure
console.log('Chart:', chart);
console.log('Config:', chart.data.config);
console.log('Selected:', chart.data.config.selectedGroupIDs);

// Test update methods
chart.helpers.updateSelectedGroupIDs('S0001');
chart.helpers.updateConfig(chart, { selectedGroupIDs: 'S0002' }, {});
```

## Special Cases

### TimeSeries Widgets

TimeSeries charts use a different update pattern:

```javascript
// Detected by class name
if (/timeSeries/.test(widget.className)) {
  // Use simplified interface
  chart.helpers.updateSelectedGroupIDs(groupID);
} else {
  // Use full config update
  chart.helpers.updateConfig(chart, newConfig, thresholds);
}
```

**Why?** TimeSeries may have different configuration requirements.

## Troubleshooting Common Issues

### Widget Not Appearing (Blank with No Errors)

**Most Common Cause: Naming Mismatch**

htmlwidgets has STRICT naming requirements. If names don't match EXACTLY (case-sensitive), dependencies silently fail to load:

```
✓ Correct - All match:
  inst/htmlwidgets/Widget_SiteList.js
  inst/htmlwidgets/Widget_SiteList.yaml
  name: 'Widget_SiteList'  (in JS)
  name = 'Widget_SiteList'  (in R)

✗ Wrong - Case mismatch:
  inst/htmlwidgets/Widget_SiteList.js
  inst/htmlwidgets/Widget_SiteList.yaml
  name: 'siteList'  (in JS)  ← lowercase!
  name = 'siteList'  (in R)  ← lowercase!
```

**Symptoms of naming mismatch:**
- Widget container appears but is empty/blank
- No JavaScript dependencies load in HTML `<head>`
- No console errors in browser
- No warnings in R

**Diagnostic commands:**

```r
# Check if htmlwidgets finds your widget
htmlwidgets:::getDependency('Widget_SiteList', 'gsm.simaerep')
# Should return list of dependencies
# If [[2]] is NULL, naming is wrong

# Verify files exist
system.file("htmlwidgets", "Widget_SiteList.yaml", package = "gsm.simaerep")
system.file("htmlwidgets", "Widget_SiteList.js", package = "gsm.simaerep")
# Should return actual paths, not ""
```

### Other Common Issues

**Dependencies not loading:**
- Check YAML file has correct folder names (e.g., `gsm.viz-2.3.0` not `gsm.viz`)
- Verify dependency folders actually exist in `inst/htmlwidgets/lib/`
- Ensure no typos in `src:` paths

**Global selector not working:**
- Verify `.gsm-widget` class on container
- Check `canvas.chart` attachment
- Ensure gsm.kri report scripts loaded

## Dependencies

### External Libraries

- **gsm.viz** - Base visualization library (includes Chart.js bundled within)
  - Chart.js is marked as external in webpack config but provided by gsm.viz at runtime

### Browser APIs

- DOM Selection: `querySelector`, `querySelectorAll`
- Events: `addEventListener`, `onchange`
- Element Manipulation: `classList`, `appendChild`

## Related Documentation

- [API Reference](API.md) - Complete chart API documentation
- [Data Structures](DATA.md) - Data format specifications
- [SiteList Integration](charts/SiteList-Integration.md) - htmlwidget templates for gsm.simaerep

## References

For complete details on gsm.kri's JavaScript files, see:
- `.cursor/gsm-kri-report-interactivity.md` in this repository

