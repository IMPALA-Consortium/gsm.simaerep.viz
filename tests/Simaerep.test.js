/**
 * @jest-environment jsdom
 */

import Simaerep from '../src/Simaerep';

// Mock d3 to avoid ES module issues
jest.mock('d3', () => ({
  rollup: jest.fn((data, reducer, ...keys) => {
    // Simple mock implementation
    const map = new Map();
    data.forEach(item => {
      const key = keys.map(k => k(item)).join('-');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(item);
    });
    return map;
  })
}));

// Mock Chart.js
jest.mock('chart.js/auto', () => {
  return jest.fn().mockImplementation(function(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.data = config.data;
    this.options = config.options;
    this.destroy = jest.fn();
    this.update = jest.fn();
    return this;
  });
});

describe('Simaerep', () => {
  let container;
  let sampleData;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Sample data matching CSV structure
    sampleData = {
      df_mean_study: [
        { Denominator: '1', cum_mean_dev_event: '0.0046' },
        { Denominator: '2', cum_mean_dev_event: '0.1107' },
        { Denominator: '3', cum_mean_dev_event: '0.4088' }
      ],
      df_mean_group_flagged: [
        { GroupID: '120', Denominator: '1', cum_mean_dev_event: '0.3333', Color: '#3182BD' },
        { GroupID: '120', Denominator: '2', cum_mean_dev_event: '0.6667', Color: '#3182BD' },
        { GroupID: '120', Denominator: '3', cum_mean_dev_event: '1.6667', Color: '#3182BD' }
      ],
      df_mean_group_not_flagged: [
        { GroupID: '10', Denominator: '1', cum_mean_dev_event: '0', Color: '#3182BD' },
        { GroupID: '10', Denominator: '2', cum_mean_dev_event: '0', Color: '#3182BD' },
        { GroupID: '10', Denominator: '3', cum_mean_dev_event: '0.1', Color: '#3182BD' }
      ],
      df_label_sites: [
        { GroupID: '10', Flag: '-2', Color: '#3182BD', nSubjects: '20' },
        { GroupID: '120', Flag: '2', Color: '#3182BD', nSubjects: '3' }
      ]
    };
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Constructor', () => {
    test('creates chart instance', () => {
      const chart = new Simaerep(container, sampleData);
      expect(chart).toBeDefined();
      expect(chart.container).toBe(container);
    });

    test('creates canvas element', () => {
      const chart = new Simaerep(container, sampleData);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    test('attaches chart instance to canvas', () => {
      const chart = new Simaerep(container, sampleData);
      const canvas = container.querySelector('canvas');
      expect(canvas.chart).toBe(chart);
    });

    test('applies gsm-widget CSS class', () => {
      new Simaerep(container, sampleData);
      expect(container.classList.contains('gsm-widget')).toBe(true);
      expect(container.classList.contains('simaerep-chart')).toBe(true);
    });

    test('initializes data structure correctly', () => {
      const chart = new Simaerep(container, sampleData, {
        selectedGroupIDs: 'None',
        aspectRatio: 1.5
      });
      
      expect(chart.data.config.selectedGroupIDs).toBe('None');
      expect(chart.data.config.aspectRatio).toBe(1.5);
      expect(chart.data._thresholds_).toBeDefined();
    });

    test('creates helper methods', () => {
      const chart = new Simaerep(container, sampleData);
      expect(chart.helpers).toBeDefined();
      expect(typeof chart.helpers.updateConfig).toBe('function');
      expect(typeof chart.helpers.updateSelectedGroupIDs).toBe('function');
    });

    test('uses default config values', () => {
      const chart = new Simaerep(container, sampleData);
      expect(chart.data.config.selectedGroupIDs).toBe('None');
      expect(chart.data.config.aspectRatio).toBe(2);  // Default is 2
      expect(chart.data.config.showGroupSelector).toBe(true);
    });
  });

  describe('Group Selector', () => {
    test('creates group selector when showGroupSelector is true', () => {
      new Simaerep(container, sampleData, { showGroupSelector: true });
      const selector = container.querySelector('.gsm-widget-control--group');
      expect(selector).toBeTruthy();
    });

    test('does not create selector when showGroupSelector is false', () => {
      new Simaerep(container, sampleData, { showGroupSelector: false });
      const selector = container.querySelector('.gsm-widget-control--group');
      expect(selector).toBeFalsy();
    });

    test('selector includes None option', () => {
      new Simaerep(container, sampleData);
      const selector = container.querySelector('.gsm-widget-control--group');
      const noneOption = Array.from(selector.options).find(opt => opt.value === 'None');
      expect(noneOption).toBeTruthy();
    });

    test('selector includes site options from data', () => {
      new Simaerep(container, sampleData);
      const selector = container.querySelector('.gsm-widget-control--group');
      const options = Array.from(selector.options).map(opt => opt.value);
      expect(options).toContain('10');
      expect(options).toContain('120');
    });

    test('selector value matches selectedGroupIDs', () => {
      new Simaerep(container, sampleData, { selectedGroupIDs: '120' });
      const selector = container.querySelector('.gsm-widget-control--group');
      expect(selector.value).toBe('120');
    });
  });

  describe('updateSelectedGroupIDs', () => {
    test('updates selectedGroupIDs in config', () => {
      const chart = new Simaerep(container, sampleData);
      chart.updateSelectedGroupIDs('120');
      expect(chart.data.config.selectedGroupIDs).toBe('120');
    });

    test('updates selector value', () => {
      const chart = new Simaerep(container, sampleData);
      chart.updateSelectedGroupIDs('120');
      // Selector is recreated on render, so we need to query it again
      const selector = container.querySelector('.gsm-widget-control--group');
      expect(selector.value).toBe('120');
    });

    test('re-renders chart', () => {
      const chart = new Simaerep(container, sampleData);
      const renderSpy = jest.spyOn(chart, 'render');
      chart.updateSelectedGroupIDs('120');
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    test('updates config and thresholds', () => {
      const chart = new Simaerep(container, sampleData);
      const newConfig = { selectedGroupIDs: '10', aspectRatio: 2 };
      const newThresholds = { upper: 5, lower: -5 };
      
      chart.updateConfig(chart, newConfig, newThresholds);
      
      expect(chart.data.config.selectedGroupIDs).toBe('10');
      expect(chart.data.config.aspectRatio).toBe(2);
      expect(chart.data._thresholds_).toEqual(newThresholds);
    });

    test('re-renders chart after config update', () => {
      const chart = new Simaerep(container, sampleData);
      const renderSpy = jest.spyOn(chart, 'render');
      chart.updateConfig(chart, { selectedGroupIDs: '10' }, {});
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('Data Processing', () => {
    test('processData creates datasets array', () => {
      const chart = new Simaerep(container, sampleData);
      const datasets = chart.processData();
      expect(Array.isArray(datasets)).toBe(true);
      expect(datasets.length).toBeGreaterThan(0);
    });

    test('processData includes study line', () => {
      const chart = new Simaerep(container, sampleData);
      const datasets = chart.processData();
      const studyDataset = datasets.find(d => d.siteType === 'study');
      expect(studyDataset).toBeTruthy();
      expect(studyDataset.label).toBe('Study');
    });

    test('processData includes flagged sites', () => {
      const chart = new Simaerep(container, sampleData);
      const datasets = chart.processData();
      const flaggedDatasets = datasets.filter(d => d.siteType === 'flagged');
      expect(flaggedDatasets.length).toBeGreaterThan(0);
    });

    test('processData includes unflagged sites', () => {
      const chart = new Simaerep(container, sampleData);
      const datasets = chart.processData();
      const unflaggedDatasets = datasets.filter(d => d.siteType === 'unflagged');
      expect(unflaggedDatasets.length).toBeGreaterThan(0);
    });

    test('selected site has thicker border', () => {
      const chart = new Simaerep(container, sampleData, { selectedGroupIDs: '120' });
      const datasets = chart.processData();
      const selectedDataset = datasets.find(d => d.groupID === '120');
      const otherDataset = datasets.find(d => d.groupID === '10');
      expect(selectedDataset.borderWidth).toBeGreaterThan(otherDataset.borderWidth);
    });

    test('selected site has higher z-order', () => {
      const chart = new Simaerep(container, sampleData, { selectedGroupIDs: '120' });
      const datasets = chart.processData();
      const selectedDataset = datasets.find(d => d.groupID === '120');
      const otherDataset = datasets.find(d => d.groupID === '10');
      expect(selectedDataset.order).toBeLessThan(otherDataset.order);
    });

    test('study line is always on top', () => {
      const chart = new Simaerep(container, sampleData);
      const datasets = chart.processData();
      const studyDataset = datasets.find(d => d.siteType === 'study');
      const otherDatasets = datasets.filter(d => d.siteType !== 'study');
      otherDatasets.forEach(d => {
        expect(studyDataset.order).toBeLessThan(d.order);
      });
    });
  });

  describe('Chart Interaction', () => {
    test('selectSite triggers updateSelectedGroupIDs', () => {
      const chart = new Simaerep(container, sampleData);
      const updateSpy = jest.spyOn(chart, 'updateSelectedGroupIDs');
      chart.selectSite('120');
      expect(updateSpy).toHaveBeenCalledWith('120');
    });

    test('selectSite dispatches custom event', () => {
      const chart = new Simaerep(container, sampleData);
      let eventFired = false;
      let eventDetail = null;
      
      container.addEventListener('site-selected', (e) => {
        eventFired = true;
        eventDetail = e.detail;
      });
      
      chart.selectSite('120');
      expect(eventFired).toBe(true);
      expect(eventDetail.groupID).toBe('120');
    });

    test('changing selector triggers selectSite', () => {
      const chart = new Simaerep(container, sampleData);
      const selectSiteSpy = jest.spyOn(chart, 'selectSite');
      const selector = container.querySelector('.gsm-widget-control--group');
      
      selector.value = '120';
      selector.dispatchEvent(new Event('change'));
      
      expect(selectSiteSpy).toHaveBeenCalledWith('120');
    });
  });

  describe('Destroy', () => {
    test('destroy clears container', () => {
      const chart = new Simaerep(container, sampleData);
      chart.destroy();
      expect(container.innerHTML).toBe('');
    });

    test('destroy removes chart instance', () => {
      const chart = new Simaerep(container, sampleData);
      const chartInstance = chart.chartInstance;
      expect(chartInstance).toBeTruthy();
      chart.destroy();
      // Chart.js destroy should have been called
    });
  });

  describe('Empty Data Handling', () => {
    test('handles empty data gracefully', () => {
      const emptyData = {
        df_mean_study: [],
        df_mean_group_flagged: [],
        df_mean_group_not_flagged: [],
        df_label_sites: []
      };
      
      const chart = new Simaerep(container, emptyData);
      expect(chart).toBeDefined();
      expect(chart.chartInstance).toBeTruthy();
    });

    test('handles missing data properties', () => {
      const chart = new Simaerep(container, {});
      expect(chart).toBeDefined();
      expect(chart.chartInstance).toBeTruthy();
    });
  });
});

