/**
 * SiteList - A list-based visualization for clinical trial sites
 * Supports gsm.viz site selection functionality
 */

class SiteList {
  constructor(container, data, config = {}) {
    this.container = container;
    this.data = data || [];
    this.config = {
      selectedGroupIDs: config.selectedGroupIDs || 'None',
      width: config.width || '100%',
      height: config.height || 'auto',
      maxHeight: config.maxHeight || '600px',
      showGroupSelector: config.showGroupSelector !== false,
      groupLabelKey: config.groupLabelKey || 'GroupID',
      ...config,
    };

    // Initialize chart structure
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'none'; // Hidden canvas for compatibility
    
    // CRITICAL: Attach chart instance to canvas for gsm.kri integration
    this.canvas.chart = this;

    // Create data structure expected by gsm.kri
    this.data = {
      config: this.config,
      _thresholds_: config.thresholds || {},
      sites: data || [],
    };

    // Helper methods required by gsm.kri
    this.helpers = {
      updateConfig: this.updateConfig.bind(this),
      updateSelectedGroupIDs: this.updateSelectedGroupIDs.bind(this),
    };

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
   * Render the site list
   */
  render() {
    // Clear container
    this.container.innerHTML = '';
    this.container.classList.add('gsm-widget', 'site-list');

    // Add canvas for compatibility
    this.container.appendChild(this.canvas);

    // Create list container
    const listContainer = document.createElement('div');
    listContainer.className = 'site-list-container';
    listContainer.style.maxHeight = this.config.maxHeight;
    listContainer.style.overflowY = 'auto';
    listContainer.style.border = '1px solid #ddd';
    listContainer.style.borderRadius = '4px';
    listContainer.style.padding = '10px';

    // Create header
    const header = document.createElement('div');
    header.className = 'site-list-header';
    header.style.marginBottom = '10px';
    header.style.fontWeight = 'bold';
    header.style.fontSize = '14px';
    header.innerHTML = `Sites (${this.data.sites.length})`;
    listContainer.appendChild(header);

    // Create list
    const list = document.createElement('ul');
    list.className = 'site-list-items';
    list.style.listStyle = 'none';
    list.style.margin = '0';
    list.style.padding = '0';

    // Add site items
    this.data.sites.forEach((site) => {
      const item = this.createSiteItem(site);
      list.appendChild(item);
    });

    listContainer.appendChild(list);
    this.container.appendChild(listContainer);

    // Add group selector if enabled
    if (this.config.showGroupSelector) {
      this.addGroupSelector();
    }
  }

  /**
   * Create a site list item
   */
  createSiteItem(site) {
    const item = document.createElement('li');
    item.className = 'site-list-item';
    item.style.padding = '8px 12px';
    item.style.margin = '4px 0';
    item.style.cursor = 'pointer';
    item.style.borderRadius = '4px';
    item.style.transition = 'background-color 0.2s';
    item.style.border = '1px solid transparent';

    const groupID = site[this.config.groupLabelKey] || site.GroupID;
    const isSelected = this.data.config.selectedGroupIDs === groupID;

    // Style based on selection
    if (isSelected) {
      item.style.backgroundColor = '#e3f2fd';
      item.style.border = '1px solid #2196f3';
      item.style.fontWeight = 'bold';
    } else {
      item.style.backgroundColor = '#f9f9f9';
    }

    // Site information
    const siteInfo = document.createElement('div');
    siteInfo.style.display = 'flex';
    siteInfo.style.justifyContent = 'space-between';
    siteInfo.style.alignItems = 'center';

    // Add icon and site ID container
    const leftContent = document.createElement('div');
    leftContent.style.display = 'flex';
    leftContent.style.alignItems = 'center';
    leftContent.style.gap = '8px';

    // Add location/site icon
    const icon = document.createElement('span');
    icon.innerHTML = '📍'; // Location pin emoji
    icon.style.fontSize = '16px';
    icon.style.opacity = isSelected ? '1' : '0.7';

    const siteId = document.createElement('span');
    siteId.className = 'site-id';
    siteId.textContent = groupID;
    siteId.style.fontWeight = isSelected ? 'bold' : 'normal';

    leftContent.appendChild(icon);
    leftContent.appendChild(siteId);

    const siteDetails = document.createElement('span');
    siteDetails.className = 'site-details';
    siteDetails.style.fontSize = '12px';
    siteDetails.style.color = '#666';
    
    // Add additional info if available
    if (site.InvestigatorLastName) {
      siteDetails.textContent = site.InvestigatorLastName;
    } else if (site.Country) {
      siteDetails.textContent = site.Country;
    }

    siteInfo.appendChild(leftContent);
    if (siteDetails.textContent) {
      siteInfo.appendChild(siteDetails);
    }
    item.appendChild(siteInfo);

    // Add click handler
    item.addEventListener('click', () => {
      this.selectSite(groupID);
    });

    // Hover effects
    item.addEventListener('mouseenter', () => {
      if (!isSelected) {
        item.style.backgroundColor = '#f0f0f0';
      }
    });

    item.addEventListener('mouseleave', () => {
      if (!isSelected) {
        item.style.backgroundColor = '#f9f9f9';
      }
    });

    return item;
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

    // Update the group selector if it exists
    const selector = this.container.querySelector('.gsm-widget-control--group');
    if (selector) {
      selector.value = groupID;
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
    label.textContent = 'Filter: ';
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

    // Add site options
    this.data.sites.forEach((site) => {
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
  }

  /**
   * Destroy the chart
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

export default SiteList;

