/**
 * SimaerepChart - Time series visualization for simaerep clinical trial monitoring
 * Shows cumulative deviation trends across sites over time
 * Supports gsm.viz site selection functionality
 * 
 * Copyright (c) 2025 IMPALA Consortium
 * Licensed under the MIT License - see LICENSE.md
 */

import Chart from 'chart.js/auto';
import getTooltipAesthetics from './util/getTooltipAesthetics.js';
import hexToRgba from './util/hexToRgba.js';
import structureGroupMetadata from './util/structureGroupMetadata.js';
import formatGroupTooltipLabel from './util/formatGroupTooltipLabel.js';

class Simaerep {
  constructor(container, data, config = {}) {
    this.container = container;
    this.rawData = data || {};
    
    // Extract metric fields from metric object if provided
    const metric = config.metric || {};
    
    this.config = {
      selectedGroupIDs: config.selectedGroupIDs || 'None',
      width: config.width || '100%',
      height: config.height || 'auto',
      aspectRatio: config.aspectRatio || 2,
      showGroupSelector: config.showGroupSelector !== false,
      groupLabelKey: config.groupLabelKey || 'GroupID',
      GroupLevel: config.GroupLevel || metric.GroupLevel || 'Site',
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

    this.render();
  }

  /**
   * Update chart configuration - required by gsm.kri
   */
  updateConfig(chart, config, thresholds) {
    this.data.config = { ...this.data.config, ...config };
    this.data._thresholds_ = thresholds || this.data._thresholds_;
    this.render();
  }

  /**
   * Update selected group IDs - required by gsm.kri
   */
  updateSelectedGroupIDs(groupID) {
    this.data.config.selectedGroupIDs = groupID;
    this.render();
  }

  /**
   * Process input data into Chart.js datasets
   */
  processData() {
    const datasets = [];
    const selectedGroupID = this.data.config.selectedGroupIDs;
    
    // Check if a site is actually selected (not 'None')
    const hasSelection = selectedGroupID && selectedGroupID !== 'None';

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
      const isSelected = groupID === selectedGroupID;
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
        order: isSelected ? 1 : 3 // Selected sites on top
      });
    });

    // 2. Add flagged sites (second layer)
    const flaggedGroups = groupByGroupID(flaggedSites);
    Object.entries(flaggedGroups).forEach(([groupID, points]) => {
      const isSelected = groupID === selectedGroupID;
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
        order: isSelected ? 1 : 2 // Selected sites on top, flagged above unflagged
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

    // Create chart wrapper
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'simaerep-chart-wrapper';
    chartWrapper.style.position = 'relative';
    chartWrapper.style.width = '100%';
    
    // Calculate height accounting for selector dropdown
    const selectorHeight = this.config.showGroupSelector ? 40 : 0;
    const availableHeight = this.config.height === 'auto' ? '100%' : 
      (typeof this.config.height === 'number' ? `${this.config.height - selectorHeight}px` : 
       `calc(${this.config.height} - ${selectorHeight}px)`);
    
    chartWrapper.style.height = availableHeight;
    chartWrapper.style.maxHeight = availableHeight;
    
    // Add canvas
    chartWrapper.appendChild(this.canvas);
    this.container.appendChild(chartWrapper);

    // Destroy existing chart if present
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

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
          tooltip: {
            enabled: true,
            mode: 'nearest',
            intersect: false,
            ...getTooltipAesthetics(),
            callbacks: {
              title: (context) => {
                if (context.length > 0) {
                  const dataset = context[0].dataset;
                  if (dataset.siteType === 'study') {
                    return 'Study Mean';
                  }
                  const groupID = dataset.groupID;
                  const metadata = this.groupMetadata?.get(groupID);
                  if (metadata && metadata.InvestigatorLastName) {
                    return `Site ${groupID} - ${metadata.InvestigatorLastName}`;
                  }
                  return `Site ${groupID}`;
                }
                return '';
              },
              label: (context) => {
                const value = context.parsed.y.toFixed(2);
                const xValue = context.parsed.x.toFixed(0);
                const groupID = context.dataset.groupID;
                const siteInfo = this.siteMetadata[groupID];
                const metadata = this.groupMetadata?.get(groupID);
                
                // Debug logging
                console.log('Tooltip debug:', {
                  groupID,
                  hasSiteMetadata: !!this.siteMetadata,
                  siteMetadataKeys: this.siteMetadata ? Object.keys(this.siteMetadata).length : 0,
                  hasSiteInfo: !!siteInfo,
                  siteInfo: siteInfo,
                  siteType: context.dataset.siteType
                });
                
                const labels = [
                  `Average Cumulative ${this.config.Numerator}: ${value}`,
                  `${this.config.Denominator}: ${xValue}`
                ];
                
                // Add KRI metrics from df_label_sites
                if (siteInfo && context.dataset.siteType !== 'study') {
                  if (siteInfo.Score !== undefined) {
                    labels.push(`${this.config.Score}: ${Number(siteInfo.Score).toFixed(2)}`);
                  }
                  if (siteInfo.ExpectedNumerator !== undefined) {
                    labels.push(`${this.config.ExpectedNumerator}: ${Number(siteInfo.ExpectedNumerator).toFixed(2)}`);
                  }
                  if (siteInfo.Flag !== undefined) {
                    labels.push(`Flag: ${siteInfo.Flag}`);
                  }
                }
                
                // Add extended metadata from df_groups
                if (metadata && context.dataset.siteType !== 'study') {
                  const metadataLabels = formatGroupTooltipLabel(metadata, this.config);
                  labels.push(...metadataLabels);
                }
                
                return labels;
              },
              labelPointStyle: () => ({ pointStyle: 'circle' })
            }
          }
        },
        interaction: {
          mode: 'nearest',
          intersect: false
        }
      }
    });

    // Add group selector if enabled
    if (this.config.showGroupSelector) {
      this.addGroupSelector();
    }
  }

  /**
   * Add group selector dropdown
   */
  addGroupSelector() {
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'gsm-widget-control-container';
    selectorContainer.style.marginTop = '10px';

    const label = document.createElement('label');
    label.textContent = 'Site: ';
    label.style.marginRight = '8px';
    label.style.fontSize = '14px';

    const select = document.createElement('select');
    select.className = 'gsm-widget-control--group';
    select.style.padding = '4px 8px';
    select.style.borderRadius = '4px';
    select.style.border = '1px solid #ccc';

    // Add "None" option
    const noneOption = document.createElement('option');
    noneOption.value = 'None';
    noneOption.textContent = 'None';
    select.appendChild(noneOption);

    // Get unique site IDs from data
    const siteLabels = this.rawData.df_label_sites || [];
    siteLabels.forEach((site) => {
      const option = document.createElement('option');
      const groupID = site[this.config.groupLabelKey] || site.GroupID;
      option.value = groupID;
      option.textContent = groupID;
      select.appendChild(option);
    });

    // Set current value
    select.value = this.data.config.selectedGroupIDs;

    // Add change handler
    select.addEventListener('change', (e) => {
      this.selectSite(e.target.value);
    });

    selectorContainer.appendChild(label);
    selectorContainer.appendChild(select);
    this.container.appendChild(selectorContainer);
    
    this.selector = select;
  }

  /**
   * Handle site selection
   */
  selectSite(groupID) {
    this.updateSelectedGroupIDs(groupID);

    // Trigger change event for integration with other widgets
    const event = new CustomEvent('site-selected', {
      detail: { groupID },
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
    this.container.innerHTML = '';
  }
}

export default Simaerep;

