# SimaerepChart Integration Guide

**Chart Type:** SimaerepChart - Time series visualization for simaerep clinical trial monitoring data

⚠️ **IMPORTANT:** These are PROPOSED templates for gsm.simaerep R package integration. These files must be implemented in the gsm.simaerep R package, NOT in this repository.

## Overview

This document provides templates for integrating the SimaerepChart visualization into the gsm.simaerep R package as an htmlwidget. The chart displays cumulative deviation trends across clinical trial sites over time, showing:

- **Study line** - Overall study trend (black, bold line)
- **Flagged sites** - Sites with statistical anomalies (colored lines)  
- **Unflagged sites** - Normal sites (lighter lines)
- **Interactive site selection** - Compatible with gsm.viz group selector

## Prerequisites

Before implementing this integration:

1. **Deploy gsm.simaerep.viz bundle** to gsm.simaerep package
   - See [main README deployment section](../README.md#deploying-to-gsmsimaerep)
   - Build: `npm run build`
   - Copy bundle files to `inst/htmlwidgets/lib/gsm.simaerep.viz/`

2. **Ensure gsm.viz dependency** is available
   - gsm.viz includes Chart.js (used by SimaerepChart)
   - SimaerepChart requires Chart.js for rendering

3. **Prepare simaerep data** using `prepare_visualization_data()` R function
   - Returns list with: df_mean_study, df_mean_group_flagged, df_mean_group_not_flagged, df_label_sites

## ⚠️ Critical Naming Requirements

**STRICT NAMING RULE:** All names must match EXACTLY (case-sensitive). htmlwidgets has strict naming requirements - if names don't match perfectly, dependencies will silently fail to load.

**The following MUST all be identical:**

1. ✓ JavaScript filename: `Widget_Simaerep.js`
2. ✓ YAML filename: `Widget_Simaerep.yaml`
3. ✓ JS widget name: `name: 'Widget_Simaerep'` (in .js file)
4. ✓ R function name: `name = 'Widget_Simaerep'` (in createWidget call)

**Example of WRONG naming (will fail silently):**
```r
# ✗ Bad - Case mismatch
File: Widget_Simaerep.js
JS:   name: 'simaerepChart'     # ← lowercase!
R:    name = 'simaerepChart'     # ← lowercase!
```

**Symptoms of naming mismatch:**
- Widget container appears but is empty/blank
- No JavaScript dependencies load in HTML `<head>`
- No console errors in browser
- No warnings in R

## Integration Files

### 1. JavaScript Binding (Widget_Simaerep.js)

**Purpose:** HTMLWidgets JavaScript binding that creates Simaerep instances from R data.

**Location in gsm.simaerep:** `inst/htmlwidgets/Widget_Simaerep.js`

```javascript
HTMLWidgets.widget({
    name: 'Widget_Simaerep',  // ⚠️ MUST match filename and R function name
    type: 'output',
    factory: function(el, width, height) {
        return {
            renderValue: function(input) {
                if (input.bDebug)
                    console.log(input);

                // Coerce lChartConfig to object if needed
                if (Object.prototype.toString.call(input.lChartConfig) !== '[object Object]') {
                    input.lChartConfig = {};
                }

                // Assign unique ID to element
                el.id = `simaerepChart--${input.strStudyId}_${input.strScoreCol}`;

                // Prepare data structure for SimaerepChart
                const chartData = {
                    df_mean_study: input.df_mean_study,
                    df_mean_group_flagged: input.df_mean_group_flagged,
                    df_mean_group_not_flagged: input.df_mean_group_not_flagged,
                    df_label_sites: input.df_label_sites
                };

                // Configure chart
                const chartConfig = {
                    selectedGroupIDs: input.lChartConfig.selectedGroupIDs || 'None',
                    aspectRatio: input.lChartConfig.aspectRatio || 1,
                    showGroupSelector: input.bAddGroupSelect !== false,
                    width: width,
                    height: height,
                    groupLabelKey: 'GroupID'
                };

                // Create Simaerep instance
                const instance = new gsmSimaerepViz.Simaerep(
                    el,
                    chartData,
                    chartConfig
                );

                // Store instance for later access
                el.chartInstance = instance;
            },
            resize: function(width, height) {
                // Handle resize if needed
                if (el.chartInstance) {
                    el.chartInstance.data.config.width = width;
                    el.chartInstance.data.config.height = height;
                    el.chartInstance.render();
                }
            }
        };
    }
});
```

**Implementation Notes:**
- Uses `gsmSimaerepViz.SimaerepChart` from the bundled library
- Accepts R data frames converted to JSON format
- Supports optional configuration via `lChartConfig`
- Compatible with gsm.kri report interactivity system
- **Tooltip styling**: Tooltips use the standard gsm.viz aesthetic with white semi-transparent background, black text, Roboto font, and proper borders for consistency across all gsm.kri widgets
- **Tooltip interaction**: Shows only the nearest single point on hover (not all points at same x-coordinate) for better user experience

### 2. Dependencies Configuration (Widget_Simaerep.yaml)

**Purpose:** Declares JavaScript dependencies for the widget.

**Location in gsm.simaerep:** `inst/htmlwidgets/Widget_Simaerep.yaml`

```yaml
dependencies:
  - name: gsmSimaerepViz
    version: 0.1.0
    src: 'htmlwidgets/lib/gsm.simaerep.viz'
    script: 'index.js'
```

**Implementation Notes:**
- gsm.simaerep.viz bundle includes both SiteList and SimaerepChart
- Chart.js is bundled within gsm.simaerep.viz (no separate dependency needed)
- Version should match package version
- Ensure `index.js` and `index.js.map` are present in the lib folder

### 3. R Wrapper Function (R/Widget_Simaerep.R)

**Purpose:** R function that creates the htmlwidget, with data validation and documentation.

**Location in gsm.simaerep:** `R/Widget_Simaerep.R`

```r
#' Create SimaerepChart Visualization Widget
#'
#' Creates an interactive time series chart showing cumulative deviation trends
#' across clinical trial sites over time. Displays study line, flagged sites,
#' and unflagged sites with site selection capability.
#'
#' @param df_mean_study Data frame with study-level reference line
#'   (columns: Denominator, cum_mean_dev_event)
#' @param df_mean_group_flagged Data frame with flagged site lines
#'   (columns: GroupID, Denominator, cum_mean_dev_event, Color)
#' @param df_mean_group_not_flagged Data frame with unflagged site lines
#'   (same structure as df_mean_group_flagged)
#' @param df_label_sites Data frame with site metadata
#'   (columns: GroupID, Flag, Color, nSubjects)
#' @param strStudyId Study identifier for element ID generation
#' @param strScoreCol Score column name for element ID generation
#' @param lChartConfig List of chart configuration options:
#'   \itemize{
#'     \item{selectedGroupIDs}{Character. Initial selected site (default: 'None')}
#'     \item{aspectRatio}{Numeric. Chart aspect ratio (default: 1)}
#'   }
#' @param bAddGroupSelect Logical. Show site selector dropdown (default: TRUE)
#' @param bDebug Logical. Enable debug console logging (default: FALSE)
#' @param width Widget width (can be specified in pixels or percentage)
#' @param height Widget height (can be specified in pixels or percentage)
#' @param elementId Optional element ID for the widget container
#'
#' @return An htmlwidget object displaying the SimaerepChart
#'
#' @examples
#' \dontrun{
#' # Prepare visualization data
#' viz_data <- prepare_visualization_data(
#'   df_site = df_site,
#'   strStudyId = "STUDY001",
#'   strScoreCol = "Score"
#' )
#'
#' # Create widget
#' Widget_Simaerep(
#'   df_mean_study = viz_data$df_mean_study,
#'   df_mean_group_flagged = viz_data$df_mean_group_flagged,
#'   df_mean_group_not_flagged = viz_data$df_mean_group_not_flagged,
#'   df_label_sites = viz_data$df_label_sites,
#'   strStudyId = "STUDY001",
#'   strScoreCol = "Score",
#'   lChartConfig = list(aspectRatio = 1.5),
#'   bAddGroupSelect = TRUE
#' )
#' }
#'
#' @export
Widget_Simaerep <- function(
  df_mean_study,
  df_mean_group_flagged,
  df_mean_group_not_flagged,
  df_label_sites,
  strStudyId = "study",
  strScoreCol = "score",
  lChartConfig = list(),
  bAddGroupSelect = TRUE,
  bDebug = FALSE,
  width = NULL,
  height = NULL,
  elementId = NULL
) {
  
  # Validate required data frames
  if (!is.data.frame(df_mean_study) || nrow(df_mean_study) == 0) {
    stop("df_mean_study must be a non-empty data frame")
  }
  
  if (!is.data.frame(df_label_sites) || nrow(df_label_sites) == 0) {
    stop("df_label_sites must be a non-empty data frame")
  }
  
  # Validate required columns
  required_study_cols <- c("Denominator", "cum_mean_dev_event")
  if (!all(required_study_cols %in% names(df_mean_study))) {
    stop(paste("df_mean_study must contain columns:", 
               paste(required_study_cols, collapse = ", ")))
  }
  
  required_label_cols <- c("GroupID", "Flag", "Color")
  if (!all(required_label_cols %in% names(df_label_sites))) {
    stop(paste("df_label_sites must contain columns:", 
               paste(required_label_cols, collapse = ", ")))
  }
  
  # Prepare data for JavaScript
  input <- list(
    df_mean_study = df_mean_study,
    df_mean_group_flagged = if (is.data.frame(df_mean_group_flagged)) df_mean_group_flagged else data.frame(),
    df_mean_group_not_flagged = if (is.data.frame(df_mean_group_not_flagged)) df_mean_group_not_flagged else data.frame(),
    df_label_sites = df_label_sites,
    strStudyId = strStudyId,
    strScoreCol = strScoreCol,
    lChartConfig = lChartConfig,
    bAddGroupSelect = bAddGroupSelect,
    bDebug = bDebug
  )
  
  # Create widget
  htmlwidgets::createWidget(
    name = 'Widget_Simaerep',  # ⚠️ MUST match JS name and filenames
    x = input,
    width = width,
    height = height,
    package = 'gsm.simaerep',
    elementId = elementId,
    sizingPolicy = htmlwidgets::sizingPolicy(
      defaultWidth = "100%",
      defaultHeight = 500,
      padding = 10,
      viewer.padding = 10,
      browser.fill = TRUE,
      viewer.fill = TRUE,
      knitr.figure = TRUE,
      knitr.defaultWidth = "100%",
      knitr.defaultHeight = 500
    )
  )
}

#' Shiny output binding for Widget_Simaerep
#'
#' @param outputId Output variable name
#' @param width Widget width
#' @param height Widget height
#'
#' @export
Widget_SimaerepOutput <- function(outputId, width = '100%', height = '500px') {
  htmlwidgets::shinyWidgetOutput(outputId, 'Widget_Simaerep', width, height, package = 'gsm.simaerep')
}

#' Shiny render function for Widget_Simaerep
#'
#' @param expr Expression that generates a Widget_Simaerep
#' @param env Environment in which to evaluate expr
#' @param quoted Logical. Is expr a quoted expression?
#'
#' @export
renderWidget_Simaerep <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) }
  htmlwidgets::shinyRenderWidget(expr, Widget_SimaerepOutput, env, quoted = TRUE)
}
```

**Implementation Notes:**
- Includes comprehensive roxygen2 documentation
- Validates required data frames and columns
- Provides sensible defaults for all optional parameters
- Includes Shiny helper functions for reactive contexts
- Sizing policy optimized for reports and Shiny apps

## Troubleshooting

### Widget Not Appearing (Blank with No Errors)

**MOST COMMON CAUSE: Naming Mismatch**

htmlwidgets has STRICT naming requirements. If names don't match EXACTLY (case-sensitive), dependencies silently fail to load:

```
✓ Correct - All match:
  inst/htmlwidgets/Widget_Simaerep.js
  inst/htmlwidgets/Widget_Simaerep.yaml
  name: 'Widget_Simaerep'  (in JS)
  name = 'Widget_Simaerep'  (in R)

✗ Wrong - Case mismatch:
  inst/htmlwidgets/Widget_Simaerep.js
  inst/htmlwidgets/Widget_Simaerep.yaml
  name: 'simaerepChart'  (in JS)  ← lowercase!
  name = 'simaerepChart'  (in R)  ← lowercase!
```

**Symptoms:**
- Widget container appears but is empty/blank
- No JavaScript dependencies load in HTML `<head>`
- No console errors in browser
- No warnings in R

**Diagnostic Commands:**

```r
# Check if htmlwidgets finds your widget
htmlwidgets:::getDependency('Widget_Simaerep', 'gsm.simaerep')
# Should return list of dependencies
# If [[1]] is NULL, naming is wrong

# Verify files exist
system.file("htmlwidgets", "Widget_Simaerep.yaml", package = "gsm.simaerep")
system.file("htmlwidgets", "Widget_Simaerep.js", package = "gsm.simaerep")
# Should return actual paths, not ""

# Check bundle exists
system.file("htmlwidgets", "lib", "gsm.simaerep.viz", "index.js", package = "gsm.simaerep")
# Should return path to bundle
```

### Other Common Issues

**Dependencies not loading:**
- Check YAML file has correct folder name: `gsm.simaerep.viz` (not versioned)
- Verify dependency folders exist in `inst/htmlwidgets/lib/`
- Ensure no typos in `src:` paths

**Chart renders but site selection doesn't work:**
- Verify gsm.kri report scripts are loaded
- Check browser console for JavaScript errors
- Ensure `.gsm-widget` class is applied to container

**Data not displaying:**
- Check data frame column names match expected structure
- Verify data frames are not empty
- Enable debug mode: `bDebug = TRUE`

**Browser Console Debugging:**

```javascript
// Find widget
const widget = document.querySelector('.gsm-widget.simaerep-chart');
const canvas = widget.querySelector('canvas');
const chart = canvas.chart;

// Verify structure
console.log('Chart:', chart);
console.log('Config:', chart.data.config);
console.log('Data:', chart.rawData);

// Test update methods
chart.helpers.updateSelectedGroupIDs('120');
```

## Next Steps

To implement this integration in gsm.simaerep:

- [ ] Deploy gsm.simaerep.viz bundle (see [README deployment section](../README.md#deploying-to-gsmsimaerep))
- [ ] Create `R/Widget_Simaerep.R` with the R wrapper function
- [ ] Create `inst/htmlwidgets/Widget_Simaerep.js` with JavaScript binding
- [ ] Create `inst/htmlwidgets/Widget_Simaerep.yaml` with dependencies
- [ ] Update NAMESPACE with exports
- [ ] Document the function
- [ ] Test in gsm.simaerep package
- [ ] Test in gsm.kri reports with global selector

## Data Structure Reference

The chart expects data from `prepare_visualization_data()` with the following structure:

**df_mean_study:**
- `Denominator` (numeric) - X-axis values
- `cum_mean_dev_event` (numeric) - Y-axis values (cumulative deviation)

**df_mean_group_flagged:**
- `GroupID` (character) - Site identifier
- `Denominator` (numeric) - X-axis values
- `cum_mean_dev_event` (numeric) - Y-axis values
- `Color` (character) - Hex color code

**df_mean_group_not_flagged:**
- Same structure as df_mean_group_flagged

**df_label_sites:**
- `GroupID` (character) - Site identifier
- `Flag` (numeric) - Flagging status (-2, -1, 0, 1, 2)
- `Color` (character) - Hex color code
- `nSubjects` (numeric) - Number of subjects at site

## Related Documentation

- [Main README](../README.md) - Project overview and deployment instructions
- [API Reference](../API.md) - Complete API documentation
- [Integration Guide](../INTEGRATION.md) - gsm.kri integration details
- [Data Structures](../DATA.md) - Data format specifications

