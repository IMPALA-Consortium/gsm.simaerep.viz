--- Cursor Command: add_chart_docs.md ---

Generate htmlwidget integration documentation for a new chart type in gsm.simaerep.viz.

This command ONLY creates documentation files in the docs/ folder. 
It does NOT copy files to gsm.simaerep or test integration.

WORKFLOW:

1. Ask user for chart type name (e.g., "SiteList", "BarChart", "ScatterPlot")
   - Use PascalCase for class names (e.g., Widget_SiteList)
   - ⚠️ CRITICAL: All naming must be consistent (case-sensitive)
   - Widget name will be used for: JS filename, YAML filename, JS widget name, R function name

2. Create docs/charts/{ChartType}-Integration.md containing:
   
   a) Header section:
      - Chart name and purpose
      - Clear warning: "⚠️ These are PROPOSED templates for gsm.simaerep integration"
      - "These files must be implemented in gsm.simaerep R package, not in this repo"
   
   b) Prerequisites section:
      - Link to main README deployment section
      - Note about gsm.viz dependency (which includes Chart.js)
   
   c) Critical Naming Requirements section:
      - ⚠️ Emphasize STRICT naming requirements
      - All names must match EXACTLY (case-sensitive)
      - List all four places name must match:
        * JavaScript filename (Widget_{ChartType}.js)
        * YAML filename (Widget_{ChartType}.yaml)
        * JS widget name (name: 'Widget_{ChartType}')
        * R function name (name = 'Widget_{ChartType}')
      - Warning about silent failure if names mismatch
   
   d) Three code sections (JavaScript, YAML, R):
      - Each with: purpose explanation, target location, full code block, implementation notes
      - Widget_{ChartType}.js (JavaScript binding with HTMLWidgets.widget pattern)
        * Include: name: 'Widget_{ChartType}' (MUST match exactly)
      - Widget_{ChartType}.yaml (Dependencies: gsm.simaerep.viz, gsm.viz)
      - Widget_{ChartType}.R (R wrapper function with roxygen docs)
        * Include: name = 'Widget_{ChartType}' (MUST match exactly)
        * Include Shiny helpers: Widget_{ChartType}Output and renderWidget_{ChartType}
   
   e) Troubleshooting section:
      - Common issue: Naming mismatch (MOST COMMON)
      - Include R diagnostic commands to check naming
      - Browser console debugging tips
   
   f) Next Steps section:
      - Simple checklist referencing manual implementation in gsm.simaerep
      - Link to deployment instructions in README
      - NO copying or testing steps
   
   g) Related Documentation links

3. Update docs/README.md:
   - Add entry for new chart in available charts list
   - Link to the integration guide

4. Summary output:
   - Show path to generated file
   - Remind: "Documentation created. Implement these templates in gsm.simaerep when ready."
   - Do NOT suggest copying files or testing

IMPORTANT:
- Only create markdown files in docs/charts/
- Never create actual .js, .yaml, or .R files
- Never copy anything to other repos
- Never test integration in gsm.simaerep
- Follow the pattern established in docs/charts/SiteList-Integration.md

--- End Command ---

