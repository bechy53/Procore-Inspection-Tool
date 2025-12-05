// Bulk Inspector - Analyze multiple Procore inspections at once

class BulkInspector {
    constructor() {
        this.inspectionTabs = [];
        this.extractedInspections = [];
        this.currentFilter = 'all';
        this.isCancelled = false;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.scanTabsBtn = document.getElementById('scanTabsBtn');
        this.extractAllBtn = document.getElementById('extractAllBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.tabsSection = document.getElementById('tabsSection');
        this.tabsList = document.getElementById('tabsList');
        this.summarySection = document.getElementById('summarySection');
        this.inspectionsList = document.getElementById('inspectionsList');
        this.status = document.getElementById('status');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deselectAllBtn = document.getElementById('deselectAllBtn');
        
        // Stats elements
        this.totalInspectionsSpan = document.getElementById('totalInspections');
        this.totalAllItemsSpan = document.getElementById('totalAllItems');
        this.totalIncompleteSpan = document.getElementById('totalIncomplete');
    }

    attachEventListeners() {
        this.scanTabsBtn.addEventListener('click', () => this.scanTabs());
        this.extractAllBtn.addEventListener('click', () => this.extractAllInspections());
        this.cancelBtn.addEventListener('click', () => this.cancelExtraction());
        this.exportBtn.addEventListener('click', () => this.exportSummary());
        this.selectAllBtn.addEventListener('click', () => this.selectAllTabs());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAllTabs());
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.applyFilter(filter);
            });
        });
    }

    async scanTabs() {
        this.setStatus('Scanning open tabs...', 'loading');
        
        try {
            // Get all tabs in current window
            const tabs = await chrome.tabs.query({ currentWindow: true });
            
            // Helper function to validate Procore URL
            const isValidProcoreUrl = (urlString) => {
                if (!urlString) return false;
                try {
                    const url = new URL(urlString);
                    return url.hostname.endsWith('.procore.com') || url.hostname === 'app.procore.com';
                } catch {
                    return false;
                }
            };
            
            // Filter for Procore inspection tabs
            this.inspectionTabs = tabs.filter(tab => {
                if (!tab.url || !isValidProcoreUrl(tab.url)) return false;
                return tab.url.includes('/inspections/') || tab.url.includes('/inspection/');
            });

            if (this.inspectionTabs.length === 0) {
                this.setStatus('No Procore inspection tabs found. Please open some inspection pages first.', 'error');
                this.tabsSection.style.display = 'none';
                this.extractAllBtn.disabled = true;
                return;
            }

            this.displayTabs();
            this.setStatus(`Found ${this.inspectionTabs.length} inspection tab${this.inspectionTabs.length !== 1 ? 's' : ''}`, 'success');
            this.extractAllBtn.disabled = false;

        } catch (error) {
            this.setStatus(`Error scanning tabs: ${error.message}`, 'error');
            console.error('Error:', error);
        }
    }

    displayTabs() {
        this.tabsSection.style.display = 'block';
        this.tabsList.innerHTML = '';

        this.inspectionTabs.forEach((tab, index) => {
            const tabItem = document.createElement('div');
            tabItem.className = 'tab-item';
            
            const title = tab.title || 'Untitled';
            const url = tab.url;
            
            tabItem.innerHTML = `
                <input type="checkbox" class="tab-checkbox" data-tab-id="${tab.id}" checked>
                <div class="tab-info">
                    <div class="tab-title">${this.escapeHtml(title)}</div>
                    <div class="tab-url">${this.escapeHtml(url)}</div>
                </div>
                <div class="tab-id">Tab ${tab.id}</div>
            `;
            
            this.tabsList.appendChild(tabItem);
        });
    }

    selectAllTabs() {
        document.querySelectorAll('.tab-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    deselectAllTabs() {
        document.querySelectorAll('.tab-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    async extractAllInspections() {
        // Get selected tabs
        const selectedCheckboxes = document.querySelectorAll('.tab-checkbox:checked');
        const selectedTabIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.tabId));
        
        if (selectedTabIds.length === 0) {
            this.setStatus('Please select at least one inspection tab', 'error');
            return;
        }

        this.isCancelled = false;
        this.extractedInspections = [];
        this.scanTabsBtn.disabled = true;
        this.extractAllBtn.style.display = 'none';
        this.cancelBtn.style.display = 'inline-block';
        this.exportBtn.disabled = true;
        this.showProgress('Starting extraction...', 0);

        try {
            for (let i = 0; i < selectedTabIds.length; i++) {
                if (this.isCancelled) {
                    throw new Error('Extraction cancelled');
                }

                const tabId = selectedTabIds[i];
                const tab = this.inspectionTabs.find(t => t.id === tabId);
                
                const progress = (i / selectedTabIds.length) * 100;
                this.updateProgress(`Navigating to inspection ${i + 1} of ${selectedTabIds.length}...`, progress);

                try {
                    // Navigate to the tab to ensure content script is active
                    await chrome.tabs.update(tabId, { active: true });
                    
                    // Wait for tab to be fully active and loaded
                    await this.sleep(800);
                    
                    // Ensure content script is injected
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        });
                    } catch (scriptError) {
                        // Content script might already be loaded, ignore error
                    }
                    
                    // Small delay after script injection
                    await this.sleep(300);
                    
                    this.updateProgress(`Extracting from inspection ${i + 1} of ${selectedTabIds.length}...`, progress + (50 / selectedTabIds.length));

                    // Send message to content script to extract items
                    const response = await chrome.tabs.sendMessage(tabId, { 
                        action: 'extractInspectionItems' 
                    });

                    if (response.success) {
                        this.extractedInspections.push({
                            tabId: tabId,
                            title: tab.title,
                            url: tab.url,
                            items: response.items
                        });
                    } else {
                        console.error(`Failed to extract from tab ${tabId}:`, response.error);
                        // Add entry with error
                        this.extractedInspections.push({
                            tabId: tabId,
                            title: tab.title,
                            url: tab.url,
                            items: [],
                            error: response.error || 'Extraction failed'
                        });
                    }
                } catch (error) {
                    console.error(`Error extracting from tab ${tabId}:`, error);
                    // Add entry with error
                    this.extractedInspections.push({
                        tabId: tabId,
                        title: tab.title,
                        url: tab.url,
                        items: [],
                        error: error.message || 'Extraction failed'
                    });
                }
            }

            this.hideProgress();
            this.displaySummary();
            
            const successCount = this.extractedInspections.filter(i => !i.error && i.items.length > 0).length;
            const failCount = this.extractedInspections.length - successCount;
            
            if (failCount > 0) {
                this.setStatus(`Extracted ${successCount} inspection${successCount !== 1 ? 's' : ''} (${failCount} failed)`, 'success');
            } else {
                this.setStatus(`Successfully extracted ${successCount} inspection${successCount !== 1 ? 's' : ''}`, 'success');
            }

        } catch (error) {
            this.hideProgress();
            this.setStatus(`Error: ${error.message}`, 'error');
            console.error('Extraction error:', error);
        } finally {
            this.scanTabsBtn.disabled = false;
            this.extractAllBtn.style.display = 'inline-block';
            this.cancelBtn.style.display = 'none';
        }
    }

    cancelExtraction() {
        this.isCancelled = true;
        this.setStatus('Cancelling extraction...', 'loading');
    }

    displaySummary() {
        if (this.extractedInspections.length === 0) {
            this.summarySection.style.display = 'none';
            return;
        }

        this.summarySection.style.display = 'block';
        this.exportBtn.disabled = false;

        // Calculate totals (excluding failed extractions)
        let totalItems = 0;
        let totalIncomplete = 0;
        const successfulInspections = this.extractedInspections.filter(i => !i.error);

        successfulInspections.forEach(inspection => {
            totalItems += inspection.items.length;
            inspection.items.forEach(item => {
                const isFilled = item.currentResponse || item.textValue;
                if (!isFilled) {
                    totalIncomplete++;
                }
            });
        });

        this.totalInspectionsSpan.textContent = successfulInspections.length;
        this.totalAllItemsSpan.textContent = totalItems;
        this.totalIncompleteSpan.textContent = totalIncomplete;

        this.displayInspections();
    }

    displayInspections() {
        this.inspectionsList.innerHTML = '';

        const filteredInspections = this.getFilteredInspections();

        if (filteredInspections.length === 0) {
            this.inspectionsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No inspections match the current filter.</div>
                </div>
            `;
            return;
        }

        filteredInspections.forEach((inspection, index) => {
            const card = this.createInspectionCard(inspection, index);
            this.inspectionsList.appendChild(card);
        });
    }

    createInspectionCard(inspection, index) {
        const card = document.createElement('div');
        card.className = 'inspection-card';

        // Check if there was an error extracting
        if (inspection.error) {
            card.innerHTML = `
                <div class="inspection-header">
                    <div>
                        <div class="inspection-title">${this.escapeHtml(inspection.title)}</div>
                        <div class="inspection-url">${this.escapeHtml(inspection.url)}</div>
                    </div>
                    <div class="inspection-stats">
                        <div class="inspection-stat incomplete">
                            <span class="inspection-stat-value">!</span>
                            <span class="inspection-stat-label">Error</span>
                        </div>
                    </div>
                </div>
                <div class="inspection-details">
                    <div class="empty-state-text" style="color: #f44336;">
                        Failed to extract: ${this.escapeHtml(inspection.error)}
                    </div>
                </div>
            `;
            
            const header = card.querySelector('.inspection-header');
            header.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });
            
            return card;
        }

        const totalItems = inspection.items.length;
        const incompleteItems = inspection.items.filter(item => {
            return !(item.currentResponse || item.textValue);
        });
        const completeItems = totalItems - incompleteItems.length;

        const incompleteCount = incompleteItems.length;

        card.innerHTML = `
            <div class="inspection-header">
                <div>
                    <div class="inspection-title">${this.escapeHtml(inspection.title)}</div>
                    <div class="inspection-url">${this.escapeHtml(inspection.url)}</div>
                </div>
                <div class="inspection-stats">
                    <div class="inspection-stat">
                        <span class="inspection-stat-value">${totalItems}</span>
                        <span class="inspection-stat-label">Total</span>
                    </div>
                    <div class="inspection-stat complete">
                        <span class="inspection-stat-value">${completeItems}</span>
                        <span class="inspection-stat-label">Complete</span>
                    </div>
                    <div class="inspection-stat incomplete">
                        <span class="inspection-stat-value">${incompleteCount}</span>
                        <span class="inspection-stat-label">Incomplete</span>
                    </div>
                    <span class="expand-icon">▼</span>
                </div>
            </div>
            <div class="inspection-details">
                ${incompleteItems.length > 0 ? `
                    <div class="items-section">
                        <div class="items-section-title">Incomplete Items (${incompleteItems.length})</div>
                        ${incompleteItems.map(item => this.createItemRow(item)).join('')}
                    </div>
                ` : '<div class="empty-state-text">All items are complete!</div>'}
            </div>
        `;

        // Toggle expansion on header click
        const header = card.querySelector('.inspection-header');
        header.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });

        return card;
    }

    createItemRow(item) {
        const isFilled = item.currentResponse || item.textValue;
        const statusClass = isFilled ? 'filled' : 'empty';
        const statusText = isFilled ? 'Filled' : 'Empty';
        
        let responseInfo = '';
        if (item.currentResponse) {
            const responseClass = item.currentResponse.toLowerCase().replace(/[^a-z]/g, '');
            responseInfo = `<span class="response-badge response-${responseClass}">${this.escapeHtml(item.currentResponse)}</span>`;
        } else if (item.textValue) {
            responseInfo = `<span class="response-badge response-na">${this.escapeHtml(item.textValue)}</span>`;
        }

        return `
            <div class="item-row">
                <div class="item-number">${this.escapeHtml(item.itemNumber || '#' + (item.index + 1))}</div>
                <div class="item-text">${this.escapeHtml(item.title)}${responseInfo}</div>
                <div class="item-status ${statusClass}">${statusText}</div>
            </div>
        `;
    }

    getFilteredInspections() {
        if (this.currentFilter === 'all') {
            return this.extractedInspections;
        } else if (this.currentFilter === 'incomplete') {
            return this.extractedInspections.filter(inspection => {
                if (inspection.error) return false; // Don't show errors in incomplete filter
                const incompleteCount = inspection.items.filter(item => 
                    !(item.currentResponse || item.textValue)
                ).length;
                return incompleteCount > 0;
            });
        } else if (this.currentFilter === 'complete') {
            return this.extractedInspections.filter(inspection => {
                if (inspection.error) return false; // Don't show errors in complete filter
                const incompleteCount = inspection.items.filter(item => 
                    !(item.currentResponse || item.textValue)
                ).length;
                return incompleteCount === 0 && inspection.items.length > 0;
            });
        }
        return this.extractedInspections;
    }

    applyFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.displayInspections();
    }

    exportSummary() {
        if (this.extractedInspections.length === 0) {
            this.setStatus('No data to export', 'error');
            return;
        }

        // Create CSV content
        let csvContent = 'Inspection,Tab ID,URL,Item Number,Item Title,Status,Response,Error\n';

        this.extractedInspections.forEach(inspection => {
            if (inspection.error) {
                // Add error row
                const row = [
                    this.escapeCsv(inspection.title),
                    inspection.tabId,
                    this.escapeCsv(inspection.url),
                    '',
                    '',
                    'Error',
                    '',
                    this.escapeCsv(inspection.error)
                ].join(',');
                csvContent += row + '\n';
            } else {
                inspection.items.forEach(item => {
                    const isFilled = item.currentResponse || item.textValue;
                    const status = isFilled ? 'Complete' : 'Incomplete';
                    const response = item.currentResponse || item.textValue || '';
                    
                    const row = [
                        this.escapeCsv(inspection.title),
                        inspection.tabId,
                        this.escapeCsv(inspection.url),
                        this.escapeCsv(item.itemNumber || ''),
                        this.escapeCsv(item.title),
                        status,
                        this.escapeCsv(response),
                        ''
                    ].join(',');
                    
                    csvContent += row + '\n';
                });
            }
        });

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-inspection-summary-${this.getTimestamp()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.setStatus('Summary exported successfully', 'success');
    }

    showProgress(text, percent) {
        this.progressContainer.style.display = 'block';
        this.progressText.textContent = text;
        this.progressFill.style.width = percent + '%';
    }

    updateProgress(text, percent) {
        this.progressText.textContent = text;
        this.progressFill.style.width = percent + '%';
    }

    hideProgress() {
        this.progressContainer.style.display = 'none';
    }

    setStatus(message, type = '') {
        this.status.textContent = message;
        this.status.className = 'status ' + type;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeCsv(text) {
        if (typeof text !== 'string') {
            text = String(text);
        }
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            return '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
    }

    getTimestamp() {
        const now = new Date();
        return now.getFullYear() + 
               String(now.getMonth() + 1).padStart(2, '0') + 
               String(now.getDate()).padStart(2, '0') + '-' +
               String(now.getHours()).padStart(2, '0') + 
               String(now.getMinutes()).padStart(2, '0') + 
               String(now.getSeconds()).padStart(2, '0');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BulkInspector();
});
