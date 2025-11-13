# SiteList Chart - gsm.simaerep Integration Guide

> **⚠️ Implementation Notice**  
> This document contains **proposed templates** for integrating the SiteList chart into the **gsm.simaerep** R package.  
> These files are NOT part of gsm.simaerep.viz. They must be implemented in gsm.simaerep.

## Overview

The SiteList chart displays an interactive list of clinical trial sites with support for cross-widget site selection in gsm.kri reports.

**Key Features:**
- List-based site display
- Integrated with gsm.kri's global site selector
- Supports country/site filtering
- Highlights selected sites

## Prerequisites

1. Build and deploy gsm.simaerep.viz bundle to gsm.simaerep:

```bash
cd gsm.simaerep.viz
npm run build
mkdir -p ../gsm.simaerep/inst/htmlwidgets/lib/gsm.simaerep.viz
cp index.js index.js.map ../gsm.simaerep/inst/htmlwidgets/lib/gsm.simaerep.viz/
```

2. Ensure gsm.viz dependency is already in gsm.simaerep (Chart.js is bundled within gsm.viz)

## ⚠️ Critical: Naming Requirements

**htmlwidgets has STRICT naming requirements.** All names must match EXACTLY (case-sensitive):

```
JavaScript file:  inst/htmlwidgets/Widget_SiteList.js
YAML file:        inst/htmlwidgets/Widget_SiteList.yaml
JS widget name:   name: 'Widget_SiteList'
R function name:  name = 'Widget_SiteList'
```

**All four must use IDENTICAL names.** Mismatch causes **silent failure**:
- Dependencies won't load in HTML header
- Widget appears blank with no console errors
- No warning messages in R

This is a common deployment issue. Always verify name consistency across all files.

## Integration Files

### 1. JavaScript Binding

**Location in gsm.simaerep:** `inst/htmlwidgets/Widget_SiteList.js`

This file creates the htmlwidget binding that connects R data to the JavaScript chart.

```javascript
/**
 * htmlwidget binding for SiteList chart
 * Connects R data to gsmSimaerepViz.SiteList chart from gsm.simaerep.viz library
 */

HTMLWidgets.widget({
  name: 'Widget_SiteList',
  type: 'output',
  
  factory: function(el, width, height) {
    return {
      renderValue: function(x) {
        // Add required CSS classes for gsm.kri report interactivity
        el.classList.add('gsm-widget', 'site-list');
        
        // Clear any existing content
        el.innerHTML = '';
        
        // Create chart instance from gsm.simaerep.viz library
        const chart = new gsmSimaerepViz.SiteList(el, x.data, x.config);
        
        // CRITICAL: Attach chart to canvas for global site selector
        const canvas = el.querySelector('canvas');
        if (canvas) {
          canvas.chart = chart;
        }
        
        // Create group selector dropdown
        const select = document.createElement('select');
        select.className = 'gsm-widget-control--group';
        select.innerHTML = '<option>None</option>';
        
        // Populate dropdown with unique group IDs
        const groupIDs = [...new Set(x.data.map(d => d.GroupID))];
        groupIDs.forEach(id => {
          const option = document.createElement('option');
          option.value = id;
          option.textContent = id;
          if (id === x.config.selectedGroupIDs) {
            option.selected = true;
          }
          select.appendChild(option);
        });
        
        el.appendChild(select);
        
        // Handle local selection changes
        select.addEventListener('change', function(e) {
          chart.helpers.updateSelectedGroupIDs(e.target.value);
        });
      },
      
      resize: function(width, height) {
        // Optional: handle widget resize if needed
      }
    };
  }
});
```

**Key Implementation Notes:**
- The `gsm-widget` class is required for gsm.kri's overallGroupDropdown.js to detect the widget
- `canvas.chart` attachment enables cross-widget site selection
- The `gsm-widget-control--group` class allows the global selector to sync this dropdown
- HTMLWidgets automatically loads dependencies specified in the YAML file

---

### 2. Dependency Configuration

**Location in gsm.simaerep:** `inst/htmlwidgets/Widget_SiteList.yaml`

This file declares all JavaScript dependencies needed for the widget.

```yaml
# htmlwidget dependencies for SiteList chart

dependencies:
  # Main chart library from gsm.simaerep.viz
  - name: gsm.simaerep.viz
    version: 0.1.0
    src: htmlwidgets/lib/gsm.simaerep.viz
    script: index.js
    
  # Base visualization library (includes Chart.js bundled within)
  - name: gsm.viz
    version: 2.2.0
    src: htmlwidgets/lib/gsm.viz
    script: index.js
```

**Key Implementation Notes:**
- Dependencies load in order listed
- Versions should match those in gsm.simaerep.viz/package.json
- The `src` paths are relative to `inst/` in the R package
- Chart.js is bundled within gsm.viz, no separate Chart.js dependency needed
- Ensure gsm.viz is already deployed to gsm.simaerep before testing

---

### 3. R Wrapper Function

**Location in gsm.simaerep:** `R/Widget_SiteList.R`

This function provides the R interface for creating SiteList widgets.

```r
#' Site List Widget
#'
#' Create an interactive site list visualization with cross-widget selection support
#' for gsm.kri reports.
#'
#' @param data Data frame containing site information. Must include a \code{GroupID} column.
#'   Additional columns like \code{InvestigatorLastName}, \code{Country}, \code{Status} are 
#'   optional but recommended for better site identification.
#' @param selectedGroupIDs Character string specifying initially selected site ID. 
#'   Default is \code{"None"} (no selection).
#' @param maxHeight Character string specifying maximum height for the scrollable list.
#'   Default is \code{"600px"}. Use CSS units (px, vh, etc.).
#' @param showGroupSelector Logical indicating whether to show the group selector dropdown.
#'   Default is \code{TRUE}.
#' @param groupLabelKey Character string specifying which column to use for site labels
#'   in the dropdown. Default is \code{"GroupID"}.
#' @param width Widget width. Default is \code{NULL} for automatic sizing.
#' @param height Widget height. Default is \code{NULL} for automatic sizing.
#' @param elementId Optional element ID for the widget container. Useful for Shiny apps.
#'
#' @return An htmlwidget object that can be rendered in R Markdown reports or Shiny apps.
#'
#' @examples
#' \dontrun{
#' library(gsm.simaerep)
#' 
#' # Prepare site data
#' dfSites <- data.frame(
#'   GroupID = c("S0001", "S0002", "S0003"),
#'   InvestigatorLastName = c("Smith", "Jones", "Brown"),
#'   Country = c("USA", "UK", "Canada"),
#'   Status = c("Active", "Active", "Inactive"),
#'   SubjectCount = c(25, 30, 15)
#' )
#' 
#' # Create site list widget
#' Widget_SiteList(
#'   data = dfSites,
#'   selectedGroupIDs = "None",
#'   maxHeight = "500px"
#' )
#' 
#' # With custom label
#' Widget_SiteList(
#'   data = dfSites,
#'   groupLabelKey = "InvestigatorLastName"
#' )
#' 
#' # In an R Markdown report
#' Widget_SiteList(
#'   data = dfSites,
#'   selectedGroupIDs = "S0001",
#'   maxHeight = "400px",
#'   showGroupSelector = TRUE
#' )
#' }
#'
#' @seealso 
#' \code{\link{siteListOutput}} for use in Shiny apps
#' 
#' @export
Widget_SiteList <- function(
  data,
  selectedGroupIDs = "None",
  maxHeight = "600px",
  showGroupSelector = TRUE,
  groupLabelKey = "GroupID",
  width = NULL,
  height = NULL,
  elementId = NULL
) {
  
  # Validate required inputs
  if (!is.data.frame(data)) {
    stop("data must be a data frame")
  }
  
  if (!"GroupID" %in% names(data)) {
    stop("data must contain a 'GroupID' column")
  }
  
  if (!groupLabelKey %in% names(data)) {
    stop(sprintf("groupLabelKey '%s' not found in data columns", groupLabelKey))
  }
  
  # Convert data to list format for JSON serialization
  data_list <- lapply(seq_len(nrow(data)), function(i) {
    as.list(data[i, ])
  })
  
  # Prepare configuration object
  config <- list(
    selectedGroupIDs = selectedGroupIDs,
    maxHeight = maxHeight,
    showGroupSelector = showGroupSelector,
    groupLabelKey = groupLabelKey
  )
  
  # Create htmlwidget
  htmlwidgets::createWidget(
    name = 'Widget_SiteList',
    x = list(
      data = data_list,
      config = config
    ),
    width = width,
    height = height,
    package = 'gsm.simaerep',
    elementId = elementId,
    sizingPolicy = htmlwidgets::sizingPolicy(
      padding = 0,
      browser.fill = TRUE,
      viewer.fill = TRUE,
      knitr.figure = FALSE
    )
  )
}

#' Shiny output binding for SiteList widget
#' 
#' @param outputId Output variable to read from
#' @param width Widget width (CSS units)
#' @param height Widget height (CSS units)
#' 
#' @return A Shiny output binding
#' 
#' @examples
#' \dontrun{
#' # In UI
#' Widget_SiteListOutput("siteListWidget")
#' 
#' # In server
#' output$siteListWidget <- renderWidget_SiteList({
#'   Widget_SiteList(data = dfSites)
#' })
#' }
#' 
#' @export
Widget_SiteListOutput <- function(outputId, width = "100%", height = "400px") {
  htmlwidgets::shinyWidgetOutput(
    outputId, 
    "Widget_SiteList", 
    width, 
    height, 
    package = "gsm.simaerep"
  )
}

#' Shiny render function for SiteList widget
#' 
#' @param expr Expression that returns a SiteList widget
#' @param env Environment in which to evaluate \code{expr}
#' @param quoted Logical indicating whether \code{expr} is quoted
#' 
#' @return A reactive Shiny render function
#' 
#' @examples
#' \dontrun{
#' output$siteListWidget <- renderWidget_SiteList({
#'   Widget_SiteList(
#'     data = filteredData(),
#'     selectedGroupIDs = input$selectedSite
#'   )
#' })
#' }
#' 
#' @export
renderWidget_SiteList <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { 
    expr <- substitute(expr) 
  }
  htmlwidgets::shinyRenderWidget(
    expr, 
    Widget_SiteListOutput, 
    env, 
    quoted = TRUE
  )
}
```

**Key Implementation Notes:**
- Input validation ensures required data structure before passing to JavaScript
- Data frame is converted to list format for proper JSON serialization
- Configuration passes through to JavaScript unchanged
- Shiny bindings included for interactive apps
- Sizing policy allows flexible widget dimensions in reports
- roxygen2 documentation provides usage examples and parameter descriptions

---

## Testing the Integration

After implementing these files in gsm.simaerep:

### R Console Testing

```r
# In R console
library(gsm.simaerep)

# Load or create sample data
dfSites <- data.frame(
  GroupID = c("S0001", "S0002", "S0003"),
  InvestigatorLastName = c("Smith", "Jones", "Brown"),
  Country = c("USA", "UK", "Canada"),
  Status = c("Active", "Active", "Inactive")
)

# Create widget
widget <- Widget_SiteList(
  data = dfSites,
  selectedGroupIDs = "None",
  maxHeight = "500px"
)

# View in RStudio viewer
widget
```

### R Markdown Report

````markdown
```{r}
library(gsm.simaerep)

Widget_SiteList(
  data = dfSites,
  selectedGroupIDs = "None",
  maxHeight = "500px"
)
```
````

### Shiny Application

```r
library(shiny)
library(gsm.simaerep)

ui <- fluidPage(
  titlePanel("Site List Demo"),
  sidebarLayout(
    sidebarPanel(
      selectInput("selectedSite", "Select Site:", 
                  choices = c("None", "S0001", "S0002", "S0003"))
    ),
    mainPanel(
      Widget_SiteListOutput("siteList")
    )
  )
)

server <- function(input, output, session) {
  output$siteList <- renderWidget_SiteList({
    Widget_SiteList(
      data = dfSites,
      selectedGroupIDs = input$selectedSite
    )
  })
}

shinyApp(ui, server)
```

---

## Troubleshooting

### Common Issues

**Widget not appearing (blank with no errors):**
- **MOST COMMON:** Naming mismatch between JS, YAML, and R files
  - Verify `name:` in JS matches `name =` in R exactly (case-sensitive)
  - Verify YAML and JS filenames match the widget name exactly
  - Check: `Widget_SiteList.js`, `Widget_SiteList.yaml`, `name: 'Widget_SiteList'`
- Check that bundle files are in `inst/htmlwidgets/lib/gsm.simaerep.viz/`
- Verify YAML dependencies are correctly specified
- Ensure gsm.viz is present in gsm.simaerep (includes Chart.js)

**Global selector not working:**
- Verify `.gsm-widget` class is present on container
- Check that `canvas.chart` is attached in JavaScript binding
- Ensure gsm.kri report scripts are loaded (overallGroupDropdown.js)

**Selection not highlighting:**
- Verify SiteList chart implements `updateSelectedGroupIDs()` method
- Check browser console for JavaScript errors

**Data not displaying:**
- Validate data has `GroupID` column
- Check browser console for validation errors
- Verify JSON serialization in R (use `jsonlite::toJSON()` to test)

### Debugging Naming Issues

```r
# Check if htmlwidgets can find your widget
htmlwidgets:::getDependency('Widget_SiteList', 'gsm.simaerep')
# Should return list of dependencies, not NULL

# Verify files exist
system.file("htmlwidgets", "Widget_SiteList.yaml", package = "gsm.simaerep")
system.file("htmlwidgets", "Widget_SiteList.js", package = "gsm.simaerep")
# Should return actual paths, not ""
```

### Browser Console Debugging

```javascript
// Find widget
const widget = document.querySelector('.gsm-widget.site-list');
console.log('Widget:', widget);

// Check chart attachment
const canvas = widget.querySelector('canvas');
const chart = canvas.chart;
console.log('Chart:', chart);
console.log('Config:', chart.data.config);
console.log('Data:', chart.rawData);

// Test update method
chart.helpers.updateSelectedGroupIDs('S0001');
```

---

## Next Steps

When implementing in gsm.simaerep:

1. ✅ Chart implemented in gsm.simaerep.viz (this repo)
2. ⬜ Deploy bundle to gsm.simaerep (see [Deploying to gsm.simaerep](../../README.md#deploying-to-gsmsimaerep))
3. ⬜ Create the three files above in gsm.simaerep:
   - `inst/htmlwidgets/Widget_SiteList.js`
   - `inst/htmlwidgets/Widget_SiteList.yaml`  
   - `R/Widget_SiteList.R`
4. ⬜ Document and export function (roxygen2)
5. ⬜ Test in R console
6. ⬜ Test in R Markdown report
7. ⬜ Test in gsm.kri report with cross-widget selection
8. ⬜ Add to package NAMESPACE

These templates serve as a reference for manual implementation in gsm.simaerep.

---

## Related Documentation

- [gsm.simaerep.viz README](../../README.md)
- [API Reference](../API.md) - Complete SiteList API
- [Integration Guide](../INTEGRATION.md) - gsm.kri integration details
- [Data Structures](../DATA.md) - Data format specifications

