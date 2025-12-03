/**
 * SimaerepChart - Time series visualization for simaerep clinical trial monitoring
 * Shows cumulative deviation trends across sites over time
 * Supports gsm.viz site selection functionality
 * 
 * Copyright (c) 2025 IMPALA Consortium
 * Licensed under the MIT License - see LICENSE.md
 */

import Chart from 'chart.js/auto';
import hexToRgba from './util/hexToRgba.js';
import structureGroupMetadata from './util/structureGroupMetadata.js';

class Simaerep {
  constructor(container, data, config = {}) {
    this.container = container;
    this.rawData = data || {};
    
    // Add df_visit extraction for right panel patient trajectories
    this.visitData = this.rawData.df_visit || [];
    
    // Extract metric fields from metric object if provided
    const metric = config.metric || {};
    
    this.config = {
      selectedGroupIDs: config.selectedGroupIDs || 'None',
      width: config.width || '100%',
      height: config.height || 'auto',
      aspectRatio: config.aspectRatio || 2,
      showGroupSelector: config.showGroupSelector !== false,
      showCountrySelector: config.showCountrySelector !== false,
      groupLabelKey: config.groupLabelKey || 'GroupID',
      GroupLevel: config.GroupLevel || metric.GroupLevel || 'Site',
      // Right panel configuration
      showRightPanel: config.showRightPanel !== false,
      rightPanelWidth: config.rightPanelWidth || '50%',
      maxVisibleSitePlots: config.maxVisibleSitePlots || 4,
      sitePlotAspectRatio: config.sitePlotAspectRatio || 1,
      // KRI metadata fields extracted from metric object with fallbacks
      Metric: metric.Metric || config.Metric || 'Adverse Event Rate',
      Numerator: metric.Numerator || config.Numerator || 'Adverse Events',
      Denominator: metric.Denominator || config.Denominator || 'Visits',
      Score: metric.Score || config.Score || 'Over/Under-Reporting Probability',
      ExpectedNumerator: metric.ExpectedNumerator || config.ExpectedNumerator || 'Delta Expected AEs',
      Abbreviation: metric.Abbreviation || config.Abbreviation || 'AE',
      ...config,
    };
    
    // Store original metric object for reference
    this.metric = metric;

    // Structure group metadata if provided
    this.groupMetadata = structureGroupMetadata(config.groupMetadata, this.config);

    // Track selected country for maintaining selector state
    this.selectedCountry = 'None';

    // Initialize canvas for Chart.js
    this.canvas = document.createElement('canvas');
    
    // CRITICAL: Attach chart instance to canvas for gsm.kri integration
    this.canvas.chart = this;

    // Create data structure expected by gsm.kri
    this.data = {
      config: this.config,
      _thresholds_: config.thresholds || {},
    };

    // Helper methods required by gsm.kri
    this.helpers = {
      updateConfig: this.updateConfig.bind(this),
      updateSelectedGroupIDs: this.updateSelectedGroupIDs.bind(this),
    };

    // Chart.js instance (will be created in render)
    this.chartInstance = null;
    
    // Site plot Chart.js instances for right panel
    this.sitePlotCharts = [];

    // Unique tooltip ID for this instance (supports multiple charts on same page)
    this.tooltipId = 'simaerep-tooltip-' + Math.random().toString(36).substr(2, 9);

    this.render();
  }

  /**
   * Update chart configuration - required by gsm.kri
   */
  updateConfig(chart, config, thresholds) {
    this.data.config = { ...this.data.config, ...config };
    this.data._thresholds_ = thresholds || this.data._thresholds_;
    this.render();
    
    // Trigger interactions for selected site (if any)
    const groupID = this.data.config.selectedGroupIDs;
    if (groupID && groupID !== 'None') {
      requestAnimationFrame(() => {
        const targetSite = Array.isArray(groupID) 
          ? this.findFirstFlaggedSite(groupID) 
          : groupID;
        
        if (targetSite) {
          this.highlightSitePlot(targetSite);
          this.scrollToSitePlot(groupID);
          this.showTooltipForSite(targetSite);
        }
      });
    }
  }

  /**
   * Update selected group IDs - required by gsm.kri
   */
  updateSelectedGroupIDs(groupID, skipInteraction = false) {
    this.data.config.selectedGroupIDs = groupID;
    this.render();
    
    // If called externally (via gsm.kri group selector), also show highlight, scroll, and tooltip
    // skipInteraction is true when called from selectSite/selectCountry to avoid duplicate calls
    if (!skipInteraction && groupID && groupID !== 'None') {
      requestAnimationFrame(() => {
        const targetSite = Array.isArray(groupID) 
          ? this.findFirstFlaggedSite(groupID) 
          : groupID;
        
        if (targetSite) {
          this.highlightSitePlot(targetSite);
          this.scrollToSitePlot(groupID);
          this.showTooltipForSite(targetSite);
        }
      });
    }
  }

  /**
   * Process input data into Chart.js datasets
   */
  processData() {
    const datasets = [];
    const selectedGroupID = this.data.config.selectedGroupIDs;
    
    // Check if a site is actually selected (not 'None')
    // Handle both single selection (string) and multiple selection (array)
    const hasSelection = selectedGroupID && selectedGroupID !== 'None' && 
      (Array.isArray(selectedGroupID) ? selectedGroupID.length > 0 : true);

    // Extract data from rawData structure
    const studyData = this.rawData.df_mean_study || [];
    const flaggedSites = this.rawData.df_mean_group_flagged || [];
    const unflaggedSites = this.rawData.df_mean_group_not_flagged || [];
    const siteLabels = this.rawData.df_label_sites || [];

    // Create map of site metadata
    const siteMetadata = {};
    siteLabels.forEach(site => {
      siteMetadata[site.GroupID] = site;
    });
    
    // Store as instance property for tooltip access
    this.siteMetadata = siteMetadata;

    // Helper to group data by GroupID
    const groupByGroupID = (data) => {
      const grouped = {};
      data.forEach(row => {
        if (!grouped[row.GroupID]) {
          grouped[row.GroupID] = [];
        }
        grouped[row.GroupID].push({
          x: parseFloat(row.Denominator),
          y: parseFloat(row.cum_mean_dev_event)
        });
      });
      return grouped;
    };

    // 1. Add unflagged sites (first layer)
    const unflaggedGroups = groupByGroupID(unflaggedSites);
    Object.entries(unflaggedGroups).forEach(([groupID, points]) => {
      const isSelected = Array.isArray(selectedGroupID) 
        ? selectedGroupID.includes(groupID) 
        : groupID === selectedGroupID;
      const baseColor = siteMetadata[groupID]?.Color || '#CCCCCC';
      
      // Apply opacity reduction for unselected items when there's a selection
      const opacity = hasSelection && !isSelected ? 0.2 : 1.0;
      const color = hexToRgba(baseColor, opacity);
      
      datasets.push({
        label: `Site ${groupID}`,
        data: points,
        borderColor: color,
        backgroundColor: color,
        borderWidth: isSelected ? 3 : 1,
        pointRadius: 0,
        tension: 0,
        fill: false,
        groupID: groupID,
        siteType: 'unflagged',
        order: isSelected ? 3 : 5 // Selected unflagged sites above unselected, but below flagged
      });
    });

    // 2. Add flagged sites (second layer)
    const flaggedGroups = groupByGroupID(flaggedSites);
    Object.entries(flaggedGroups).forEach(([groupID, points]) => {
      const isSelected = Array.isArray(selectedGroupID) 
        ? selectedGroupID.includes(groupID) 
        : groupID === selectedGroupID;
      const baseColor = siteMetadata[groupID]?.Color || '#3182BD';
      
      // Apply opacity reduction for unselected items when there's a selection
      const opacity = hasSelection && !isSelected ? 0.2 : 1.0;
      const color = hexToRgba(baseColor, opacity);
      
      datasets.push({
        label: `Site ${groupID}`,
        data: points,
        borderColor: color,
        backgroundColor: color,
        borderWidth: isSelected ? 3 : 1.5,
        pointRadius: 0,
        tension: 0,
        fill: false,
        groupID: groupID,
        siteType: 'flagged',
        order: isSelected ? 1 : 2 // Selected flagged sites on top, unselected flagged above all unflagged
      });
    });

    // 3. Add study line (top layer)
    // Study line always stays at full opacity
    if (studyData.length > 0) {
      const studyPoints = studyData.map(row => ({
        x: parseFloat(row.Denominator),
        y: parseFloat(row.cum_mean_dev_event)
      }));

      datasets.push({
        label: 'Study',
        data: studyPoints,
        borderColor: '#000000',
        backgroundColor: '#000000',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0,
        fill: false,
        groupID: 'study',
        siteType: 'study',
        order: 0 // Always on top
      });
    }

    return datasets;
  }

  /**
   * Render the chart
   */
  render() {
    // Clear container
    this.container.innerHTML = '';
    this.container.classList.add('gsm-widget', 'simaerep-chart');

    // Add selectors first if enabled (at top of chart)
    if (this.config.showGroupSelector || this.config.showCountrySelector) {
      this.addSelectors();
    }

    // Calculate height accounting for selector dropdown
    const selectorHeight = (this.config.showGroupSelector || this.config.showCountrySelector) ? 40 : 0;
    const availableHeight = this.config.height === 'auto' ? '100%' : 
      (typeof this.config.height === 'number' ? `${this.config.height - selectorHeight}px` : 
       `calc(${this.config.height} - ${selectorHeight}px)`);

    // Check if right panel should be displayed
    const showRightPanel = this.config.showRightPanel && this.visitData.length > 0;

    // Create main panels container (flex layout)
    const panelsContainer = document.createElement('div');
    panelsContainer.className = 'simaerep-panels-container';
    panelsContainer.style.display = 'flex';
    panelsContainer.style.gap = '10px';
    panelsContainer.style.width = '100%';
    panelsContainer.style.height = availableHeight;
    panelsContainer.style.maxHeight = availableHeight;

    // Create left panel wrapper
    const leftPanel = document.createElement('div');
    leftPanel.className = 'simaerep-left-panel';
    leftPanel.style.flex = showRightPanel ? '1 1 50%' : '1 1 100%';
    leftPanel.style.position = 'relative';
    leftPanel.style.minWidth = '0'; // Prevent flex overflow
    leftPanel.style.overflow = 'visible'; // Allow tooltip to extend beyond panel
    
    // Store reference to left panel for tooltip positioning
    this.leftPanel = leftPanel;
    
    // Add canvas to left panel
    leftPanel.appendChild(this.canvas);
    panelsContainer.appendChild(leftPanel);

    // Create right panel if enabled and data is available
    if (showRightPanel) {
      const rightPanel = document.createElement('div');
      rightPanel.className = 'simaerep-right-panel';
      rightPanel.style.flex = '1 1 50%';
      rightPanel.style.overflowY = 'auto';
      rightPanel.style.overflowX = 'hidden';
      rightPanel.style.padding = '0 10px';
      rightPanel.style.minWidth = '0'; // Prevent flex overflow
      rightPanel.style.display = 'grid';
      rightPanel.style.gridTemplateColumns = 'repeat(2, 1fr)';
      rightPanel.style.gap = '15px';
      rightPanel.style.alignContent = 'start'; // Align grid items to the top
      
      // Store reference to right panel for later use
      this.rightPanel = rightPanel;
      
      panelsContainer.appendChild(rightPanel);
    }

    this.container.appendChild(panelsContainer);

    // Destroy existing chart instances
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    if (this.sitePlotCharts) {
      this.sitePlotCharts.forEach(item => {
        if (item.chart) {
          item.chart.destroy();
        }
      });
      this.sitePlotCharts = [];
    }

    // Render left panel chart
    this.renderLeftPanel();

    // Render right panel site plots if enabled
    if (showRightPanel) {
      this.renderSitePlots();
    }
  }

  /**
   * Render the left panel (main overview chart)
   */
  renderLeftPanel() {
    // Create Chart.js instance
    const datasets = this.processData();
    
    this.chartInstance = new Chart(this.canvas, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: this.config.height === 'auto',
        aspectRatio: this.config.aspectRatio,
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: this.config.Denominator
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          },
          y: {
            title: {
              display: true,
              text: `Average Cumulative ${this.config.Numerator} Count`
            },
            grid: {
              display: true,
              color: '#e0e0e0'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: this.getTooltipConfig('left')
        },
        interaction: {
          mode: 'nearest',
          intersect: false
        }
        // Note: No onHover handler - right panel highlighting only happens via selectors
      }
    });
  }

  /**
   * Get or create the external tooltip container
   */
  getOrCreateTooltip() {
    // Look for tooltip within this chart's left panel
    let tooltipEl = this.leftPanel ? this.leftPanel.querySelector(`#${this.tooltipId}`) : null;
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = this.tooltipId;
      tooltipEl.style.cssText = `
        position: absolute;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid black;
        border-radius: 4px;
        padding: 10px;
        pointer-events: none;
        font-family: roboto, sans-serif;
        font-size: 12px;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transition: opacity 0.1s ease;
      `;
      // Append to left panel (which has position: relative) for proper scoping
      if (this.leftPanel) {
        this.leftPanel.appendChild(tooltipEl);
      }
    }
    return tooltipEl;
  }

  /**
   * Build title HTML with colored box indicator
   */
  buildTitleHtml(dataset, groupID) {
    const color = dataset.borderColor || '#333';
    const metadata = this.groupMetadata?.get(groupID);
    
    // Handle patient lines
    if (dataset.dataType === 'patient') {
      return `<span style="display:inline-block;width:10px;height:10px;background:${color};margin-right:6px;vertical-align:middle;"></span>Patient ${dataset.subjectID}`;
    }
    
    // Handle study line
    if (dataset.siteType === 'study') {
      return `<span style="display:inline-block;width:10px;height:10px;background:${color};margin-right:6px;vertical-align:middle;"></span>Study Mean`;
    }
    
    // Site title
    let title = `Site ${groupID}`;
    if (metadata) {
      const name = metadata.InvestigatorLastName || '';
      const enrolled = metadata.ParticipantCount;
      if (name) title += ` - ${name}`;
      if (enrolled !== undefined) title += ` (${enrolled} enrolled)`;
    }
    return `<span style="display:inline-block;width:10px;height:10px;background:${color};margin-right:6px;vertical-align:middle;"></span>${title}`;
  }

  /**
   * Build basic metrics HTML (Numerator, Denominator, Score, Delta, Flag)
   */
  buildBasicMetricsHtml(context) {
    const dataset = context.dataset;
    const groupID = dataset.groupID;
    const siteInfo = this.siteMetadata[groupID];
    const value = context.parsed.y.toFixed(2);
    const xValue = context.parsed.x.toFixed(0);
    
    const lines = [];
    
    // Handle patient lines
    if (dataset.dataType === 'patient') {
      lines.push(`${this.config.Numerator}: ${value}`);
      lines.push(`${this.config.Denominator}: ${xValue}`);
      return lines.join('<br>');
    }
    
    lines.push(`${this.config.Numerator}: ${value}`);
    lines.push(`${this.config.Denominator}: ${xValue}`);
    
    // Add KRI metrics from df_label_sites
    if (siteInfo && dataset.siteType !== 'study') {
      if (siteInfo.Score !== undefined) {
        lines.push(`Score: ${Number(siteInfo.Score).toFixed(2)}`);
      }
      if (siteInfo.ExpectedNumerator !== undefined) {
        lines.push(`Delta: ${Number(siteInfo.ExpectedNumerator).toFixed(2)}`);
      }
      if (siteInfo.Flag !== undefined) {
        lines.push(`Flag: ${siteInfo.Flag}`);
      }
    }
    
    return lines.join('<br>');
  }

  /**
   * Build extra information HTML from df_groups metadata
   */
  buildExtraInfoHtml(groupID) {
    const metadata = this.groupMetadata?.get(groupID);
    if (!metadata) return '';
    
    const lines = [];
    
    // Specific fields requested in requirements
    if (metadata.studyid) lines.push(`Study ID: ${metadata.studyid}`);
    if (metadata.invid) lines.push(`Investigator ID: ${metadata.invid}`);
    if (metadata.InvestigatorFirstName || metadata.InvestigatorLastName) {
      const name = [metadata.InvestigatorFirstName, metadata.InvestigatorLastName].filter(Boolean).join(' ');
      lines.push(`Investigator Name: ${name}`);
    }
    if (metadata.Status) lines.push(`Site Status: ${metadata.Status}`);
    if (metadata.City) lines.push(`City: ${metadata.City}`);
    if (metadata.State) lines.push(`State: ${metadata.State}`);
    if (metadata.Country) lines.push(`Country: ${metadata.Country}`);
    if (metadata.ActiveParticipantCount !== undefined) lines.push(`Active Participant Count: ${metadata.ActiveParticipantCount}`);
    if (metadata.SiteCount !== undefined) lines.push(`Site Count: ${metadata.SiteCount}`);
    if (metadata.PercentParticipantsActive !== undefined) lines.push(`Percent Active Participants: ${metadata.PercentParticipantsActive}%`);
    if (metadata.ActiveParticipants) lines.push(`Active Participants: ${metadata.ActiveParticipants}`);
    
    if (lines.length === 0) return '';
    return `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #ddd;color:#666;font-size:11px;">${lines.join('<br>')}</div>`;
  }

  /**
   * Check if points are overlapping (same x/y coordinates)
   */
  detectOverlappingPoints(tooltipItems) {
    if (tooltipItems.length <= 1) return false;
    
    // Group by x/y position - consider overlapping if within small threshold
    const threshold = 0.5;
    const firstX = tooltipItems[0].parsed.x;
    const firstY = tooltipItems[0].parsed.y;
    
    for (let i = 1; i < tooltipItems.length; i++) {
      const dx = Math.abs(tooltipItems[i].parsed.x - firstX);
      const dy = Math.abs(tooltipItems[i].parsed.y - firstY);
      if (dx > threshold || dy > threshold) {
        return false; // Points are not overlapping
      }
    }
    return true; // All points are at same position
  }

  /**
   * External tooltip handler
   */
  externalTooltipHandler(context) {
    const { chart, tooltip } = context;
    const tooltipEl = this.getOrCreateTooltip();
    
    // Hide if no tooltip
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = '0';
      return;
    }
    
    // Get tooltip items
    const tooltipItems = tooltip.dataPoints || [];
    if (tooltipItems.length === 0) {
      tooltipEl.style.opacity = '0';
      return;
    }
    
    // Detect if points are overlapping
    const isOverlapping = this.detectOverlappingPoints(tooltipItems);
    
    // Build tooltip content
    let html = '';
    
    if (isOverlapping && tooltipItems.length > 1) {
      // Overlapping: show all titles + basic metrics for each (no extra info)
      tooltipItems.forEach((item, index) => {
        const dataset = item.dataset;
        const groupID = dataset.groupID;
        
        // Title with colored box
        html += `<div style="font-weight:bold;font-size:14px;margin-bottom:4px;">`;
        html += this.buildTitleHtml(dataset, groupID);
        html += `</div>`;
        
        // Basic metrics
        html += `<div style="margin-bottom:${index < tooltipItems.length - 1 ? '12px' : '0'};">`;
        html += this.buildBasicMetricsHtml(item);
        html += `</div>`;
      });
    } else {
      // Single point or non-overlapping: show full tooltip with extra info
      const item = tooltipItems[0];
      const dataset = item.dataset;
      const groupID = dataset.groupID;
      
      // Title with colored box
      html += `<div style="font-weight:bold;font-size:14px;margin-bottom:8px;">`;
      html += this.buildTitleHtml(dataset, groupID);
      html += `</div>`;
      
      // Basic metrics
      html += `<div>`;
      html += this.buildBasicMetricsHtml(item);
      html += `</div>`;
      
      // Extra information (only for non-overlapping)
      if (dataset.siteType !== 'study' && dataset.dataType !== 'patient') {
        html += this.buildExtraInfoHtml(groupID);
      }
    }
    
    tooltipEl.innerHTML = html;
    tooltipEl.style.opacity = '1';
    
    // Position tooltip relative to left panel container (which has position: relative)
    // caretX/caretY are already pixel positions within the canvas
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    const canvasWidth = this.canvas.offsetWidth;
    
    let left = tooltip.caretX + 10;
    let top = tooltip.caretY - tooltipHeight / 2;
    
    // Prevent tooltip from going off the right edge of canvas - flip to left side
    if (left + tooltipWidth > canvasWidth) {
      left = tooltip.caretX - tooltipWidth - 10;
    }
    
    // Keep tooltip within reasonable vertical bounds
    if (top < 0) {
      top = 0;
    }
    
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  }

  /**
   * Get tooltip configuration (shared between left and right panels)
   */
  getTooltipConfig(panelType = 'left') {
    return {
      enabled: false, // Disable built-in tooltip
      mode: 'nearest',
      intersect: false,
      external: (context) => this.externalTooltipHandler(context)
    };
  }

  /**
   * Process patient data for a specific site
   */
  processPatientData(groupID) {
    // Filter visit data for this GroupID
    const siteVisits = this.visitData.filter(visit => visit.GroupID === groupID);
    
    // Group by SubjectID
    const patientGroups = {};
    siteVisits.forEach(visit => {
      const subjectID = visit.SubjectID.toString();
      if (!patientGroups[subjectID]) {
        patientGroups[subjectID] = [];
      }
      patientGroups[subjectID].push({
        x: parseFloat(visit.Denominator),
        y: parseFloat(visit.Numerator)
      });
    });

    // Convert to Chart.js datasets
    const datasets = Object.entries(patientGroups).map(([subjectID, points]) => ({
      label: `Patient ${subjectID}`,
      data: points,
      borderColor: 'rgba(140, 140, 140, 1.0)',
      backgroundColor: 'rgba(140, 140, 140, 1.0)',
      borderWidth: 1,
      pointRadius: 0,
      tension: 0,
      fill: false,
      subjectID: subjectID,
      dataType: 'patient',
      order: 3 // Bottom layer
    }));

    return datasets;
  }

  /**
   * Render site plots in the right panel
   */
  renderSitePlots() {
    if (!this.rightPanel) return;

    // Clear right panel
    this.rightPanel.innerHTML = '';

    // Get flagged sites from df_label_sites, sorted by Score (ascending - most under-reporting first)
    const siteLabels = this.rawData.df_label_sites || [];
    const flaggedSites = siteLabels
      .filter(site => site.Flag !== 0 && site.Flag !== undefined)
      .sort((a, b) => {
        // Sort by Score (ascending order: lowest scores first)
        const scoreA = parseFloat(a.Score) || 0;
        const scoreB = parseFloat(b.Score) || 0;
        return scoreA - scoreB;
      });

    // Get study data for reference line
    const studyData = this.rawData.df_mean_study || [];
    const studyPoints = studyData.map(row => ({
      x: parseFloat(row.Denominator),
      y: parseFloat(row.cum_mean_dev_event)
    }));

    // Get flagged site data
    const flaggedSiteData = this.rawData.df_mean_group_flagged || [];

    // Render each flagged site
    flaggedSites.forEach((site, index) => {
      const groupID = site.GroupID;
      
      // Create container for this site plot
      const sitePlotContainer = document.createElement('div');
      sitePlotContainer.className = 'simaerep-site-plot';
      sitePlotContainer.setAttribute('data-group-id', groupID);
      sitePlotContainer.style.border = '1px solid #e0e0e0';
      sitePlotContainer.style.borderRadius = '4px';
      sitePlotContainer.style.padding = '10px';
      sitePlotContainer.style.backgroundColor = '#ffffff';

      // Add site title
      const title = document.createElement('div');
      title.className = 'site-plot-title';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px';
      title.style.fontSize = '14px';
      
      const metadata = this.groupMetadata?.get(groupID);
      if (metadata && metadata.InvestigatorLastName) {
        title.textContent = `Site ${groupID} - ${metadata.InvestigatorLastName}`;
      } else {
        title.textContent = `Site ${groupID}`;
      }
      sitePlotContainer.appendChild(title);

      // Create canvas for this site
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      sitePlotContainer.appendChild(canvas);

      // Get patient data for this site
      const patientDatasets = this.processPatientData(groupID);

      // Get site line data
      const siteLineData = flaggedSiteData
        .filter(row => row.GroupID === groupID)
        .map(row => ({
          x: parseFloat(row.Denominator),
          y: parseFloat(row.cum_mean_dev_event)
        }));

      // Build datasets: patient lines, site line, study line
      const datasets = [
        ...patientDatasets,
        // Site line (middle layer)
        {
          label: `Site ${groupID}`,
          data: siteLineData,
          borderColor: site.Color || '#3182BD',
          backgroundColor: site.Color || '#3182BD',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0,
          fill: false,
          groupID: groupID,
          siteType: 'flagged',
          order: 2
        },
        // Study reference line (top layer)
        {
          label: 'Study',
          data: studyPoints,
          borderColor: '#000000',
          backgroundColor: '#000000',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0,
          fill: false,
          groupID: 'study',
          siteType: 'study',
          order: 1
        }
      ];

      // Create Chart.js instance
      const chart = new Chart(canvas, {
        type: 'line',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: this.config.sitePlotAspectRatio,
          scales: {
            x: {
              type: 'linear',
              title: {
                display: false  // Removed for more space
              },
              grid: {
                display: true,
                color: '#e0e0e0'
              },
              ticks: {
                font: { size: 10 }
              }
            },
            y: {
              title: {
                display: false  // Removed for more space
              },
              grid: {
                display: true,
                color: '#e0e0e0'
              },
              ticks: {
                font: { size: 10 }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: this.getTooltipConfig('right')
          },
          interaction: {
            mode: 'nearest',
            intersect: false
          }
        }
      });

      // Store chart instance
      this.sitePlotCharts.push({ groupID, chart, container: sitePlotContainer });

      // Add to right panel
      this.rightPanel.appendChild(sitePlotContainer);
    });
  }

  /**
   * Highlight a site plot in the right panel (no scrolling - only visual highlight)
   */
  highlightSitePlot(groupID) {
    if (!this.rightPanel) return;

    // Remove highlight from all site plots (use outline to avoid layout shifts)
    const allPlots = this.rightPanel.querySelectorAll('.simaerep-site-plot');
    allPlots.forEach(plot => {
      plot.style.outline = 'none';
      plot.style.outlineOffset = '0';
    });

    // Highlight the specified site plot (use outline to avoid layout shifts)
    const targetPlot = this.rightPanel.querySelector(`[data-group-id="${groupID}"]`);
    if (targetPlot) {
      targetPlot.style.outline = '2px solid #3182BD';
      targetPlot.style.outlineOffset = '-2px';
    }
  }

  /**
   * Scroll to a specific site plot in the right panel (only if it's a flagged site)
   */
  scrollToSitePlot(groupID) {
    if (!this.rightPanel || !groupID || groupID === 'None') return;

    // Handle array of groupIDs (from country selection) - find first flagged site
    let targetGroupID = null;
    
    if (Array.isArray(groupID)) {
      // Find first site in the array that exists in the right panel
      for (const id of groupID) {
        const plot = this.rightPanel.querySelector(`[data-group-id="${id}"]`);
        if (plot) {
          targetGroupID = id;
          break;
        }
      }
    } else {
      targetGroupID = groupID;
    }
    
    if (!targetGroupID) return;
    
    const targetPlot = this.rightPanel.querySelector(`[data-group-id="${targetGroupID}"]`);
    if (targetPlot) {
      targetPlot.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }

  /**
   * Find the first site from an array that exists in the right panel (is flagged)
   */
  findFirstFlaggedSite(groupIDs) {
    if (!this.rightPanel || !Array.isArray(groupIDs)) return null;
    
    for (const id of groupIDs) {
      const plot = this.rightPanel.querySelector(`[data-group-id="${id}"]`);
      if (plot) {
        return id;
      }
    }
    return null;
  }

  /**
   * Show tooltip for a site at its highest x value in the left panel chart
   */
  showTooltipForSite(groupID) {
    if (!this.chartInstance || !groupID || groupID === 'None') return;

    // Find the dataset for this site
    const datasets = this.chartInstance.data.datasets;
    let targetDatasetIndex = -1;
    let maxXIndex = -1;
    let maxX = -Infinity;
    let targetDataset = null;

    for (let i = 0; i < datasets.length; i++) {
      if (datasets[i].groupID === groupID) {
        targetDatasetIndex = i;
        targetDataset = datasets[i];
        // Find the point with highest x value
        const data = datasets[i].data;
        for (let j = 0; j < data.length; j++) {
          if (data[j].x > maxX) {
            maxX = data[j].x;
            maxXIndex = j;
          }
        }
        break;
      }
    }

    if (targetDatasetIndex >= 0 && maxXIndex >= 0 && targetDataset) {
      const dataPoint = targetDataset.data[maxXIndex];
      
      // Check if scales exist (they won't in test mocks)
      if (!this.chartInstance.scales) return;
      
      // Calculate pixel position using Chart.js scales
      const xScale = this.chartInstance.scales.x;
      const yScale = this.chartInstance.scales.y;
      
      if (!xScale || !yScale) return;
      
      const pixelX = xScale.getPixelForValue(dataPoint.x);
      const pixelY = yScale.getPixelForValue(dataPoint.y);
      
      // Build mock tooltip context to manually invoke external handler
      const mockContext = {
        chart: this.chartInstance,
        tooltip: {
          opacity: 1,
          caretX: pixelX,
          caretY: pixelY,
          dataPoints: [{
            dataset: targetDataset,
            datasetIndex: targetDatasetIndex,
            dataIndex: maxXIndex,
            parsed: {
              x: dataPoint.x,
              y: dataPoint.y
            },
            raw: dataPoint
          }]
        }
      };
      
      // Directly invoke the external tooltip handler
      this.externalTooltipHandler(mockContext);
      
      // Also set active elements for visual highlight on the chart
      if (typeof this.chartInstance.setActiveElements === 'function') {
        this.chartInstance.setActiveElements([{
          datasetIndex: targetDatasetIndex,
          index: maxXIndex
        }]);
      }
      if (typeof this.chartInstance.update === 'function') {
        this.chartInstance.update('none');
      }
    }
  }

  /**
   * Add site and country selector dropdowns
   */
  addSelectors() {
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'gsm-widget-control-container';
    selectorContainer.style.marginBottom = '10px';
    selectorContainer.style.display = 'flex';
    selectorContainer.style.gap = '20px';
    selectorContainer.style.alignItems = 'center';
    selectorContainer.style.flexWrap = 'wrap';

    // Add site selector if enabled
    if (this.config.showGroupSelector) {
      const siteGroup = document.createElement('div');
      siteGroup.style.display = 'flex';
      siteGroup.style.alignItems = 'center';
      siteGroup.style.gap = '8px';

      const siteLabel = document.createElement('label');
      siteLabel.textContent = 'Site: ';
      siteLabel.style.fontSize = '14px';
      siteLabel.style.fontWeight = '500';

      const siteSelect = document.createElement('select');
      siteSelect.className = 'gsm-widget-control--group';
      siteSelect.style.padding = '4px 8px';
      siteSelect.style.borderRadius = '4px';
      siteSelect.style.border = '1px solid #ccc';
      siteSelect.style.minWidth = '150px';

      // Add "None" option
      const noneOption = document.createElement('option');
      noneOption.value = 'None';
      noneOption.textContent = 'None';
      siteSelect.appendChild(noneOption);

      // Get ALL unique site IDs from all data sources (flagged + unflagged + labels)
      const allSiteIDs = new Set();
      
      // Add sites from df_label_sites
      (this.rawData.df_label_sites || []).forEach(site => {
        allSiteIDs.add(site.GroupID);
      });
      
      // Add sites from df_mean_group_flagged
      (this.rawData.df_mean_group_flagged || []).forEach(site => {
        allSiteIDs.add(site.GroupID);
      });
      
      // Add sites from df_mean_group_not_flagged
      (this.rawData.df_mean_group_not_flagged || []).forEach(site => {
        allSiteIDs.add(site.GroupID);
      });
      
      // Sort and add all sites to the dropdown
      const sortedSiteIDs = Array.from(allSiteIDs).sort();
      sortedSiteIDs.forEach((groupID) => {
        const option = document.createElement('option');
        option.value = groupID;
        option.textContent = groupID;
        siteSelect.appendChild(option);
      });

      // Set current value
      const currentSelection = this.data.config.selectedGroupIDs;
      siteSelect.value = (Array.isArray(currentSelection) || currentSelection === 'None') 
        ? 'None' 
        : currentSelection;

      // Add change handler (will be updated with mutual reset logic)
      siteSelect.addEventListener('change', (e) => {
        this.selectSite(e.target.value);
      });

      siteGroup.appendChild(siteLabel);
      siteGroup.appendChild(siteSelect);
      selectorContainer.appendChild(siteGroup);
      
      this.siteSelector = siteSelect;
    }

    // Add country selector if enabled
    if (this.config.showCountrySelector) {
      const countryGroup = document.createElement('div');
      countryGroup.style.display = 'flex';
      countryGroup.style.alignItems = 'center';
      countryGroup.style.gap = '8px';

      const countryLabel = document.createElement('label');
      countryLabel.textContent = 'Country: ';
      countryLabel.style.fontSize = '14px';
      countryLabel.style.fontWeight = '500';

      const countrySelect = document.createElement('select');
      countrySelect.className = 'gsm-widget-control--country';
      countrySelect.style.padding = '4px 8px';
      countrySelect.style.borderRadius = '4px';
      countrySelect.style.border = '1px solid #ccc';
      countrySelect.style.minWidth = '150px';

      // Add "None" option
      const noneOption = document.createElement('option');
      noneOption.value = 'None';
      noneOption.textContent = 'None';
      countrySelect.appendChild(noneOption);

      // Extract unique countries from groupMetadata
      const countries = new Set();
      const countryToSites = {};
      
      if (this.groupMetadata && this.groupMetadata.size > 0) {
        this.groupMetadata.forEach((metadata, groupID) => {
          if (metadata.Country) {
            countries.add(metadata.Country);
            if (!countryToSites[metadata.Country]) {
              countryToSites[metadata.Country] = [];
            }
            countryToSites[metadata.Country].push(groupID);
          }
        });
      }

      // Store the mapping for later use
      this.countryToSites = countryToSites;

      // Sort and add country options
      const sortedCountries = Array.from(countries).sort();
      sortedCountries.forEach((country) => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
      });

      // Set current value
      countrySelect.value = 'None';

      // Add change handler (will be updated with mutual reset logic)
      countrySelect.addEventListener('change', (e) => {
        this.selectCountry(e.target.value);
      });

      countryGroup.appendChild(countryLabel);
      countryGroup.appendChild(countrySelect);
      selectorContainer.appendChild(countryGroup);
      
      this.countrySelector = countrySelect;
      
      // Set the value to the selected country if one is active
      if (this.selectedCountry && this.selectedCountry !== 'None') {
        countrySelect.value = this.selectedCountry;
      }
    }

    this.container.appendChild(selectorContainer);
  }

  /**
   * Handle site selection
   */
  selectSite(groupID) {
    // Reset country selector if present
    if (this.countrySelector) {
      this.countrySelector.value = 'None';
    }
    
    // Clear the selected country
    this.selectedCountry = 'None';
    
    // Use skipInteraction=true since we handle interaction below
    this.updateSelectedGroupIDs(groupID, true);

    // After render, highlight the site in right panel, scroll to it, and show tooltip
    requestAnimationFrame(() => {
      if (groupID && groupID !== 'None') {
        this.highlightSitePlot(groupID);
        this.scrollToSitePlot(groupID);
        this.showTooltipForSite(groupID);
      }
    });

    // Trigger change event for integration with other widgets
    const event = new CustomEvent('site-selected', {
      detail: { groupID },
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Handle country selection
   */
  selectCountry(country) {
    // Reset site selector if present
    if (this.siteSelector) {
      this.siteSelector.value = 'None';
    }

    // Store the selected country
    this.selectedCountry = country;

    // Get all sites for this country
    const sitesInCountry = country === 'None' ? 'None' : (this.countryToSites[country] || []);
    
    // Update selection - country only highlights on left panel, no right panel interactions
    this.updateSelectedGroupIDs(sitesInCountry, true);

    // Trigger change event for integration with other widgets
    const event = new CustomEvent('country-selected', {
      detail: { country, groupIDs: sitesInCountry },
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Destroy the chart
   */
  destroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    // Destroy all site plot chart instances
    if (this.sitePlotCharts) {
      this.sitePlotCharts.forEach(item => {
        if (item.chart) {
          item.chart.destroy();
        }
      });
      this.sitePlotCharts = [];
    }
    // Remove external tooltip element for this instance
    const tooltipEl = this.leftPanel ? this.leftPanel.querySelector(`#${this.tooltipId}`) : null;
    if (tooltipEl) {
      tooltipEl.remove();
    }
    this.container.innerHTML = '';
  }
}

export default Simaerep;

