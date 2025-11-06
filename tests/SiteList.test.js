/**
 * Unit tests for SiteList chart
 */

import SiteList from '../src/SiteList.js';

describe('SiteList', () => {
  let container;
  let sampleData;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    sampleData = [
      { GroupID: 'Site001', InvestigatorLastName: 'Smith', Country: 'USA' },
      { GroupID: 'Site002', InvestigatorLastName: 'Jones', Country: 'USA' },
      { GroupID: 'Site003', InvestigatorLastName: 'Brown', Country: 'UK' },
    ];
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    test('should create a SiteList instance', () => {
      const chart = new SiteList(container, sampleData);
      expect(chart).toBeInstanceOf(SiteList);
    });

    test('should add gsm-widget class to container', () => {
      new SiteList(container, sampleData);
      expect(container.classList.contains('gsm-widget')).toBe(true);
      expect(container.classList.contains('site-list')).toBe(true);
    });

    test('should attach chart to canvas element', () => {
      const chart = new SiteList(container, sampleData);
      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      expect(canvas.chart).toBe(chart);
    });
  });

  describe('Required gsm.viz interfaces', () => {
    test('should have data.config.selectedGroupIDs property', () => {
      const chart = new SiteList(container, sampleData);
      expect(chart.data.config).toHaveProperty('selectedGroupIDs');
      expect(chart.data.config.selectedGroupIDs).toBe('None');
    });

    test('should have data._thresholds_ property', () => {
      const chart = new SiteList(container, sampleData);
      expect(chart.data).toHaveProperty('_thresholds_');
    });

    test('should have helpers.updateConfig method', () => {
      const chart = new SiteList(container, sampleData);
      expect(chart.helpers).toHaveProperty('updateConfig');
      expect(typeof chart.helpers.updateConfig).toBe('function');
    });

    test('should have helpers.updateSelectedGroupIDs method', () => {
      const chart = new SiteList(container, sampleData);
      expect(chart.helpers).toHaveProperty('updateSelectedGroupIDs');
      expect(typeof chart.helpers.updateSelectedGroupIDs).toBe('function');
    });
  });

  describe('Rendering', () => {
    test('should render all sites', () => {
      new SiteList(container, sampleData);
      const items = container.querySelectorAll('.site-list-item');
      expect(items.length).toBe(3);
    });

    test('should display site IDs', () => {
      new SiteList(container, sampleData);
      const items = container.querySelectorAll('.site-list-item');
      expect(items[0].textContent).toContain('Site001');
      expect(items[1].textContent).toContain('Site002');
      expect(items[2].textContent).toContain('Site003');
    });

    test('should display investigator names', () => {
      new SiteList(container, sampleData);
      const items = container.querySelectorAll('.site-list-item');
      expect(items[0].textContent).toContain('Smith');
      expect(items[1].textContent).toContain('Jones');
      expect(items[2].textContent).toContain('Brown');
    });

    test('should show site count in header', () => {
      new SiteList(container, sampleData);
      const header = container.querySelector('.site-list-header');
      expect(header.textContent).toContain('Sites (3)');
    });
  });

  describe('Site selection', () => {
    test('should select site on click', () => {
      const chart = new SiteList(container, sampleData);
      const items = container.querySelectorAll('.site-list-item');
      
      items[0].click();
      
      expect(chart.data.config.selectedGroupIDs).toBe('Site001');
    });

    test('should highlight selected site', () => {
      const chart = new SiteList(container, sampleData, { selectedGroupIDs: 'Site002' });
      const items = container.querySelectorAll('.site-list-item');
      
      expect(items[1].style.backgroundColor).toBe('rgb(227, 242, 253)');
    });

    test('should dispatch site-selected event', (done) => {
      const chart = new SiteList(container, sampleData);
      
      container.addEventListener('site-selected', (event) => {
        expect(event.detail.groupID).toBe('Site001');
        done();
      });
      
      const items = container.querySelectorAll('.site-list-item');
      items[0].click();
    });
  });

  describe('Group selector', () => {
    test('should render group selector by default', () => {
      new SiteList(container, sampleData);
      const selector = container.querySelector('.gsm-widget-control--group');
      expect(selector).not.toBeNull();
    });

    test('should include None option', () => {
      new SiteList(container, sampleData);
      const selector = container.querySelector('.gsm-widget-control--group');
      const options = Array.from(selector.options).map(opt => opt.value);
      expect(options).toContain('None');
    });

    test('should include all sites in selector', () => {
      new SiteList(container, sampleData);
      const selector = container.querySelector('.gsm-widget-control--group');
      const options = Array.from(selector.options).map(opt => opt.value);
      expect(options).toContain('Site001');
      expect(options).toContain('Site002');
      expect(options).toContain('Site003');
    });

    test('should update selection when selector changes', () => {
      const chart = new SiteList(container, sampleData);
      const selector = container.querySelector('.gsm-widget-control--group');
      
      selector.value = 'Site002';
      selector.dispatchEvent(new Event('change'));
      
      expect(chart.data.config.selectedGroupIDs).toBe('Site002');
    });

    test('should not render selector when disabled', () => {
      new SiteList(container, sampleData, { showGroupSelector: false });
      const selector = container.querySelector('.gsm-widget-control--group');
      expect(selector).toBeNull();
    });
  });

  describe('Helper methods', () => {
    test('updateConfig should update configuration', () => {
      const chart = new SiteList(container, sampleData);
      const newConfig = { selectedGroupIDs: 'Site003' };
      
      chart.helpers.updateConfig(chart, newConfig, {});
      
      expect(chart.data.config.selectedGroupIDs).toBe('Site003');
    });

    test('updateSelectedGroupIDs should update selected group', () => {
      const chart = new SiteList(container, sampleData);
      
      chart.helpers.updateSelectedGroupIDs('Site002');
      
      expect(chart.data.config.selectedGroupIDs).toBe('Site002');
    });

    test('updateSelectedGroupIDs should re-render chart', () => {
      const chart = new SiteList(container, sampleData);
      
      chart.helpers.updateSelectedGroupIDs('Site002');
      
      const items = container.querySelectorAll('.site-list-item');
      expect(items[1].style.backgroundColor).toBe('rgb(227, 242, 253)');
    });
  });

  describe('Configuration', () => {
    test('should accept custom groupLabelKey', () => {
      const customData = [
        { SiteCode: 'S001', Name: 'Site One' },
        { SiteCode: 'S002', Name: 'Site Two' },
      ];
      
      new SiteList(container, customData, { groupLabelKey: 'SiteCode' });
      
      const items = container.querySelectorAll('.site-list-item');
      expect(items[0].textContent).toContain('S001');
    });

    test('should accept custom maxHeight', () => {
      new SiteList(container, sampleData, { maxHeight: '400px' });
      const listContainer = container.querySelector('.site-list-container');
      expect(listContainer.style.maxHeight).toBe('400px');
    });
  });

  describe('Cleanup', () => {
    test('should destroy chart and clean container', () => {
      const chart = new SiteList(container, sampleData);
      chart.destroy();
      expect(container.innerHTML).toBe('');
    });
  });
});

