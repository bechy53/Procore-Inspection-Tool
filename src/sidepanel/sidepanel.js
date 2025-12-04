// Sidepanel logic for Procore Inspection Filler

class InspectionFillerPanel {
    constructor() {
        this.inspectionItems = [];
        this.importedData = null;
        this.currentTab = 'single';
        
        // Bulk inspector properties
        this.inspectionTabs = [];
        this.extractedInspections = [];
        this.currentFilter = 'all';
        this.isBulkCancelled = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateUI();
    }

    initializeElements() {
        // Tab elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.singleTab = document.getElementById('singleTab');
        this.bulkTab = document.getElementById('bulkTab');
        
        // Single inspection elements
        this.extractBtn = document.getElementById('extractBtn');
        this.cancelExtractBtn = document.getElementById('cancelExtractBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.csvFileInput = document.getElementById('csvFileInput');
        this.fillBtn = document.getElementById('fillBtn');
        this.status = document.getElementById('status');
        this.itemsContainer = document.getElementById('itemsContainer');
        this.navigationHint = document.getElementById('navigationHint');
        this.statsBar = document.getElementById('statsBar');
        this.totalItemsSpan = document.getElementById('totalItems');
        this.filledItemsSpan = document.getElementById('filledItems');
        this.emptyItemsSpan = document.getElementById('emptyItems');
        
        // Progress bar elements
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // Report section elements
        this.reportSection = document.getElementById('reportSection');
        this.yesCountSpan = document.getElementById('yesCount');
        this.noCountSpan = document.getElementById('noCount');
        this.naCountSpan = document.getElementById('naCount');
        this.blankCountSpan = document.getElementById('blankCount');
        
        // Bulk inspector elements
        this.scanTabsBtn = document.getElementById('scanTabsBtn');
        this.extractAllBtn = document.getElementById('extractAllBtn');
        this.cancelBulkBtn = document.getElementById('cancelBulkBtn');
        this.exportBulkBtn = document.getElementById('exportBulkBtn');
        this.bulkProgressContainer = document.getElementById('bulkProgressContainer');
        this.bulkProgressFill = document.getElementById('bulkProgressFill');
        this.bulkProgressText = document.getElementById('bulkProgressText');
        this.bulkProgressDetails = document.getElementById('bulkProgressDetails');
        this.tabsSection = document.getElementById('tabsSection');
        this.tabsList = document.getElementById('tabsList');
        this.summarySection = document.getElementById('summarySection');
        this.inspectionsList = document.getElementById('inspectionsList');
        this.bulkStatus = document.getElementById('bulkStatus');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deselectAllBtn = document.getElementById('deselectAllBtn');
        this.totalInspectionsSpan = document.getElementById('totalInspections');
        this.totalAllItemsSpan = document.getElementById('totalAllItems');
        this.totalIncompleteSpan = document.getElementById('totalIncomplete');
        this.detailedReportBtn = document.getElementById('detailedReportBtn');
        
        // Filter state
        this.currentFilter = 'all';
        
        // Extraction cancellation flag
        this.extractionCancelled = false;
    }

    attachEventListeners() {
        // Tab switching
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
        
        // Single inspection listeners
        this.extractBtn.addEventListener('click', () => this.extractInspection());
        this.cancelExtractBtn.addEventListener('click', () => this.cancelExtraction());
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.csvFileInput.addEventListener('change', (e) => this.handleCSVImport(e));
        this.fillBtn.addEventListener('click', () => this.fillInspection());
        
        // Bulk inspector listeners
        this.scanTabsBtn.addEventListener('click', () => this.scanTabs());
        this.extractAllBtn.addEventListener('click', () => this.extractAllInspections());
        this.cancelBulkBtn.addEventListener('click', () => this.cancelBulkExtraction());
        this.exportBulkBtn.addEventListener('click', () => this.exportBulkSummary());
        this.detailedReportBtn.addEventListener('click', () => this.openDetailedReport());
        this.selectAllBtn.addEventListener('click', () => this.selectAllTabs());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAllTabs());
        
        // Filter button listeners
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.applyFilter(filter);
            });
        });
        
        // Bulk filter button listeners
        document.querySelectorAll('.bulk-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.applyBulkFilter(filter);
            });
        });
        
        // Report stat item click listeners (same as filter buttons)
        document.querySelectorAll('.report-stat-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const filter = e.currentTarget.getAttribute('data-filter');
                this.applyFilter(filter);
            });
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        this.tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Show/hide tab content
        if (tabName === 'single') {
            this.singleTab.classList.add('active');
            this.bulkTab.classList.remove('active');
        } else {
            this.singleTab.classList.remove('active');
            this.bulkTab.classList.add('active');
        }
    }

    async extractInspection() {
        this.setStatus('Extracting inspection items...', 'loading');
        this.extractBtn.style.display = 'none';
        this.cancelExtractBtn.style.display = 'inline-block';
        this.extractionCancelled = false;
        this.showProgress('Extracting items...', 0);

        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab.url.includes('procore.com')) {
                throw new Error('Please navigate to a Procore inspection page first');
            }

            // Listen for progress updates from content script
            const progressListener = (message) => {
                if (message.action === 'extractionProgress') {
                    this.updateProgress(message.text, message.percent);
                }
            };
            chrome.runtime.onMessage.addListener(progressListener);

            // Send message to content script to extract items
            const response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'extractInspectionItems' 
            });

            // Remove progress listener
            chrome.runtime.onMessage.removeListener(progressListener);
            
            // Check if extraction was cancelled
            if (this.extractionCancelled) {
                this.setStatus('Extraction cancelled', 'error');
                this.hideProgress();
                return;
            }

            if (response.success) {
                this.inspectionItems = response.items;
                this.inspectionMetadata = response.metadata || {};
                this.updateProgress('Extraction complete!', 100, true);
                await this.sleep(500);
                this.hideProgress();
                this.setStatus(`Successfully extracted ${this.inspectionItems.length} inspection items`, 'success');
                this.displayMetadata();
                this.updateUI();
                this.scrollToTop();
            } else {
                throw new Error(response.error || 'Failed to extract inspection items');
            }
        } catch (error) {
            this.hideProgress();
            // Check for connection error
            if (this.isConnectionError(error)) {
                this.setStatus('Please refresh the Procore page and try again', 'error');
                // Don't log connection errors to console to avoid extension error notifications
            } else {
                this.setStatus(`Error: ${error.message}`, 'error');
                console.error('Extraction error:', error);
            }
        } finally {
            this.extractBtn.style.display = 'inline-block';
            this.cancelExtractBtn.style.display = 'none';
        }
    }

    cancelExtraction() {
        this.extractionCancelled = true;
        
        // Send cancel message to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'cancelExtraction' });
            }
        });
        
        this.extractBtn.style.display = 'inline-block';
        this.cancelExtractBtn.style.display = 'none';
    }
    
    displayMetadata() {
        const metadataContainer = document.getElementById('metadataContainer');
        if (!this.inspectionMetadata || Object.keys(this.inspectionMetadata).length === 0) {
            metadataContainer.style.display = 'none';
            return;
        }
        
        metadataContainer.style.display = 'block';
        
        // Update metadata fields
        document.getElementById('metaName').textContent = this.inspectionMetadata.inspectionName || '-';
        document.getElementById('metaLocation').textContent = this.inspectionMetadata.location || '-';
        document.getElementById('metaNumber').textContent = this.inspectionMetadata.inspectionNumber || '-';
        document.getElementById('metaType').textContent = this.inspectionMetadata.inspectionType || '-';
        document.getElementById('metaStatus').textContent = this.inspectionMetadata.status || '-';
        document.getElementById('metaDate').textContent = this.inspectionMetadata.inspectionDate || '-';
    }

    displayItems() {
        this.itemsContainer.innerHTML = '';

        if (this.inspectionItems.length === 0) {
            this.navigationHint.style.display = 'none';
            this.itemsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No inspection items found.<br>Click "Extract Items" to scan the current page.</div>
                </div>
            `;
            return;
        }

        // Filter items based on current filter
        const filteredItems = this.getFilteredItems();
        
        if (filteredItems.length === 0) {
            this.navigationHint.style.display = 'none';
            this.itemsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No items match the current filter.</div>
                </div>
            `;
            return;
        }

        // Show navigation hint when items are displayed
        this.navigationHint.style.display = 'block';

        filteredItems.forEach(item => {
            const card = this.createItemCard(item);
            this.itemsContainer.appendChild(card);
        });
    }

    createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.setAttribute('data-item-number', item.itemNumber);

        const isFilled = (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '');
        const statusClass = isFilled ? 'filled' : 'empty';
        const statusText = isFilled ? 'Filled' : 'Empty';

        card.innerHTML = `
            <div class="item-header">
                <div class="item-number">${item.itemNumber || ('#' + (item.index + 1))}</div>
                <div class="item-title">${this.escapeHtml(item.title)}</div>
                <div class="item-status ${statusClass}">${statusText}</div>
            </div>
            <div class="item-details">
                ${item.currentResponse ? `
                    <div class="item-detail-row">
                        <span class="detail-label">Response:</span>
                        <span class="detail-value">${this.escapeHtml(item.currentResponse)}</span>
                    </div>
                ` : ''}
                ${item.textValue ? `
                    <div class="item-detail-row">
                        <span class="detail-label">Notes:</span>
                        <span class="detail-value">${this.escapeHtml(item.textValue)}</span>
                    </div>
                ` : ''}
                ${item.availableOptions.length > 0 ? `
                    <div class="item-detail-row">
                        <span class="detail-label">Options:</span>
                        <div class="options-list">
                            ${item.availableOptions.map(opt => 
                                `<span class="option-badge">${this.escapeHtml(opt)}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Add click handler to navigate to item on page
        card.addEventListener('click', async () => {
            try {
                // Scroll the clicked item card to the bottom of the sidepanel
                card.scrollIntoView({ behavior: 'smooth', block: 'end' });
                
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                await chrome.tabs.sendMessage(tab.id, { 
                    action: 'scrollToItem',
                    uniqueId: item.uniqueId,
                    itemNumber: item.itemNumber,
                    scrollToCenterPosition: item.scrollToCenterPosition
                });
                this.setStatus(`Navigated to item ${item.itemNumber}`, 'success');
            } catch (error) {
                // Check for connection error
                if (this.isConnectionError(error)) {
                    this.setStatus('Please refresh the Procore page and try again', 'error');
                    // Don't log connection errors to console to avoid extension error notifications
                } else {
                    this.setStatus('Error navigating to item', 'error');
                    console.error('Error navigating to item:', error);
                }
            }
        });

        return card;
    }

    updateStats() {
        if (this.inspectionItems.length === 0) {
            this.statsBar.style.display = 'none';
            this.reportSection.style.display = 'none';
            return;
        }

        this.statsBar.style.display = 'flex';
        this.reportSection.style.display = 'block';
        
        const filledCount = this.inspectionItems.filter(item => 
            item.currentResponse || item.textValue
        ).length;
        const emptyCount = this.inspectionItems.length - filledCount;

        this.totalItemsSpan.textContent = this.inspectionItems.length;
        this.filledItemsSpan.textContent = filledCount;
        this.emptyItemsSpan.textContent = emptyCount;
        
        // Update report counts
        this.updateReport();
    }

    exportToCSV() {
        if (this.inspectionItems.length === 0) {
            this.setStatus('No items to export', 'error');
            return;
        }

        // Create CSV content with metadata header
        let csvContent = '';
        
        // Add metadata as comments at the top
        if (this.inspectionMetadata) {
            csvContent += `# Inspection Name: ${this.inspectionMetadata.inspectionName || ''}\n`;
            csvContent += `# Location: ${this.inspectionMetadata.location || ''}\n`;
            csvContent += `# Number: ${this.inspectionMetadata.inspectionNumber || ''}\n`;
            csvContent += `# Type: ${this.inspectionMetadata.inspectionType || ''}\n`;
            csvContent += `# Status: ${this.inspectionMetadata.status || ''}\n`;
            csvContent += `# Date: ${this.inspectionMetadata.inspectionDate || ''}\n`;
            csvContent += `#\n`;
        }
        
        const headers = ['Title', 'Current Response', 'Response (Fill This)', 'Available Options'];
        const rows = this.inspectionItems.map(item => [
            this.escapeCsvValue(this.cleanTitle(item.title)),
            this.escapeCsvValue(item.currentResponse || item.textValue), // Show current button response OR text value
            this.escapeCsvValue(item.currentResponse || item.textValue), // Pre-fill with current value
            this.escapeCsvValue(item.availableOptions.join('; '))
        ]);

        csvContent += [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Download the CSV
        const timestamp = new Date().toISOString().split('T')[0];
        const inspectionName = this.inspectionMetadata?.inspectionName 
            ? this.inspectionMetadata.inspectionName.replace(/[^a-z0-9]/gi, '_').substring(0, 30) 
            : 'inspection';
        const filename = `${inspectionName}_${timestamp}.csv`;

        this.downloadCSV(csvContent, filename);
        this.setStatus(`Exported ${this.inspectionItems.length} items to CSV`, 'success');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async handleCSVImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.setStatus('Reading CSV file...', 'loading');
        this.showProgress('Reading CSV file...', 0);

        try {
            this.updateProgress('Loading file...', 30);
            const text = await file.text();
            
            this.updateProgress('Parsing CSV data...', 60);
            const data = this.parseCSV(text);
            
            this.updateProgress('Processing items...', 90);
            
            if (data.length === 0) {
                throw new Error('CSV file is empty or no items have responses. Check console for parsing details.');
            }

            this.importedData = data;
            this.updateUI();

            // Update file label to show file is loaded
            const fileLabel = document.querySelector('.file-label');
            fileLabel.classList.add('has-file');
            fileLabel.textContent = file.name;

            this.updateProgress('Import complete!', 100, true);
            await this.sleep(500);
            this.hideProgress();
            this.setStatus(`Loaded ${data.length} items from CSV - Ready to fill`, 'success');
        } catch (error) {
            this.hideProgress();
            this.setStatus(`Error reading CSV: ${error.message}`, 'error');
            console.error('CSV import error:', error);
        }
    }
    
    updateUI() {
        // Enable/disable buttons based on state
        this.exportBtn.disabled = this.inspectionItems.length === 0;
        this.fillBtn.disabled = !this.importedData || this.importedData.length === 0;
        this.csvFileInput.disabled = false; // Always allow CSV import
        
        // Only update display if we have extracted items
        if (this.inspectionItems.length > 0) {
            this.displayItems();
            this.updateStats();
        }
    }

    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        // Skip header row
        const dataLines = lines.slice(1);
        const items = [];

        dataLines.forEach((line, lineIndex) => {
            const values = this.parseCSVLine(line);
            
            if (values.length >= 2) {
                // Extract item number from title - everything before first space
                const title = values[0];
                const currentResponse = values[1] ? values[1].trim() : '';
                const fillResponse = values[2] ? values[2].trim() : '';
                // Use fill response if provided, otherwise use current response
                const response = fillResponse || currentResponse;
                let itemNumber = '';
                
                // Get everything before the first space
                const firstSpace = title.indexOf(' ');
                if (firstSpace > 0) {
                    const beforeSpace = title.substring(0, firstSpace).trim();
                    // Check if it looks like an item number (contains digits and dots/periods)
                    if (/^[\d.]+$/.test(beforeSpace)) {
                        itemNumber = beforeSpace;
                    }
                }
                
                // Only add items with valid item numbers and responses (from either column)
                if (itemNumber && response) {
                    items.push({
                        index: parseInt(itemNumber.split('.')[0]) || 0,
                        itemNumber: itemNumber,
                        title: title,
                        currentResponse: currentResponse,
                        response: response
                    });
                }
            }
        });
        return items;
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values.map(v => v.replace(/^"|"$/g, ''));
    }

    async fillInspection() {
        if (!this.importedData || this.importedData.length === 0) {
            this.setStatus('No CSV data loaded', 'error');
            return;
        }

        this.setStatus('Filling inspection items...', 'loading');
        this.fillBtn.disabled = true;
        this.fillBtn.classList.add('loading');
        this.showProgress('Filling items...', 0);

        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab.url.includes('procore.com')) {
                throw new Error('Please navigate to a Procore inspection page first');
            }

            // Listen for progress updates from content script
            const progressListener = (message) => {
                if (message.action === 'fillProgress') {
                    this.updateProgress(message.text, message.percent);
                }
            };
            chrome.runtime.onMessage.addListener(progressListener);

            // Send message to content script to fill items
            const response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'fillInspectionItems',
                items: this.importedData
            });

            // Remove progress listener
            chrome.runtime.onMessage.removeListener(progressListener);

            if (response.success) {
                const { successCount, skippedCount, errorCount, total } = response.result;
                let statusMessage = `Filled ${successCount} items`;
                if (skippedCount > 0) {
                    statusMessage += `, ${skippedCount} already correct`;
                }
                if (errorCount > 0) {
                    statusMessage += `, ${errorCount} errors`;
                }
                
                this.updateProgress('Fill complete!', 100, true);
                await this.sleep(500);
                this.hideProgress();
                this.setStatus(statusMessage, errorCount > 0 ? 'error' : 'success');
                this.scrollToTop();
            } else {
                throw new Error(response.error || 'Failed to fill inspection items');
            }
        } catch (error) {
            this.hideProgress();
            // Check for connection error
            if (this.isConnectionError(error)) {
                this.setStatus('Please refresh the Procore page and try again', 'error');
                // Don't log connection errors to console to avoid extension error notifications
            } else {
                this.setStatus(`Error: ${error.message}`, 'error');
                console.error('Fill error:', error);
            }
        } finally {
            this.fillBtn.disabled = false;
            this.fillBtn.classList.remove('loading');
        }
    }

    setStatus(message, type = '') {
        this.status.textContent = message;
        this.status.className = 'status';
        if (type) {
            this.status.classList.add(type);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    cleanTitle(title) {
        // Remove non-ASCII characters and replace with standard equivalents
        return title
            .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    escapeCsvValue(value) {
        if (!value) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    }
    
    getItemResponseType(item) {
        // Check button response first (Yes/No/N/A buttons)
        if (item.currentResponse && item.currentResponse.trim() !== '') {
            const normalizedResponse = item.currentResponse.trim().toLowerCase();
            
            if (normalizedResponse === 'yes' || normalizedResponse === 'pass') {
                return 'Yes';
            } else if (normalizedResponse === 'no' || normalizedResponse === 'fail') {
                return 'No';
            } else if (normalizedResponse === 'n/a' || normalizedResponse === 'na' || normalizedResponse === 'not applicable') {
                return 'N/A';
            }
        }
        
        // Check text field value (for items with text inputs)
        if (item.textValue && item.textValue.trim() !== '') {
            const normalizedText = item.textValue.trim().toLowerCase();
            
            // Check if text field contains yes/no/na
            if (normalizedText === 'yes' || normalizedText === 'pass') {
                return 'Yes';
            } else if (normalizedText === 'no' || normalizedText === 'fail') {
                return 'No';
            } else if (normalizedText === 'n/a' || normalizedText === 'na' || normalizedText === 'not applicable') {
                return 'N/A';
            } else {
                // Text field has content that isn't yes/no/na - treat as "Yes" (filled)
                return 'Yes';
            }
        }
        
        // No response in either field
        return 'Blank';
    }
    
    updateReport() {
        let yesCount = 0;
        let noCount = 0;
        let naCount = 0;
        let blankCount = 0;
        
        this.inspectionItems.forEach(item => {
            const responseType = this.getItemResponseType(item);
            switch(responseType) {
                case 'Yes':
                    yesCount++;
                    break;
                case 'No':
                    noCount++;
                    break;
                case 'N/A':
                    naCount++;
                    break;
                case 'Blank':
                    blankCount++;
                    break;
            }
        });
        
        this.yesCountSpan.textContent = yesCount;
        this.noCountSpan.textContent = noCount;
        this.naCountSpan.textContent = naCount;
        this.blankCountSpan.textContent = blankCount;
    }
    
    getFilteredItems() {
        if (this.currentFilter === 'all') {
            return this.inspectionItems;
        }
        
        return this.inspectionItems.filter(item => {
            const responseType = this.getItemResponseType(item);
            return responseType === this.currentFilter;
        });
    }
    
    applyFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Re-display items with the new filter
        this.displayItems();
        
        // Update status message
        const filteredCount = this.getFilteredItems().length;
        if (filter === 'all') {
            this.setStatus(`Showing all ${filteredCount} items`, 'success');
        } else {
            this.setStatus(`Filtered to ${filteredCount} "${filter}" items`, 'success');
        }
        
        // Scroll to top when filtering
        this.scrollToTop();
    }
    
    scrollToTop() {
        // Scroll the items container to the top
        if (this.itemsContainer) {
            this.itemsContainer.scrollTop = 0;
        }
    }
    
    scrollToBottom() {
        // Scroll the main page to the bottom
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'scrollToBottom' }, (response) => {
                    if (chrome.runtime.lastError) {
                        this.setStatus('Error: Please make sure you are on a Procore page', 'error');
                    }
                });
            }
        });
    }
    
    showProgress(text, percent) {
        if (this.progressContainer) {
            this.progressContainer.style.display = 'block';
            this.updateProgress(text, percent);
        }
    }
    
    updateProgress(text, percent, complete = false) {
        if (this.progressText) {
            this.progressText.textContent = text;
        }
        if (this.progressFill) {
            this.progressFill.style.width = `${percent}%`;
            if (complete) {
                this.progressFill.classList.add('complete');
            } else {
                this.progressFill.classList.remove('complete');
            }
        }
    }
    
    hideProgress() {
        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
            this.progressFill.style.width = '0%';
            this.progressFill.classList.remove('complete');
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    isConnectionError(error) {
        // Check if error is related to connection/messaging issues
        const errorMessage = error.message ? error.message.toLowerCase() : '';
        return errorMessage.includes('receiving end does not exist') ||
               errorMessage.includes('could not establish connection') ||
               errorMessage.includes('connection') ||
               errorMessage.includes('message port closed') ||
               error.message === 'Error: The tab was closed.';
    }
    
    // ==================== BULK INSPECTOR METHODS ====================
    
    async scanTabs() {
        this.setBulkStatus('Scanning open tabs...', 'loading');
        
        try {
            const tabs = await chrome.tabs.query({ currentWindow: true });
            
            this.inspectionTabs = tabs.filter(tab => 
                tab.url && 
                tab.url.includes('procore.com') && 
                (tab.url.includes('/inspections/') || tab.url.includes('/inspection/'))
            );

            if (this.inspectionTabs.length === 0) {
                this.setBulkStatus('No Procore inspection tabs found. Please open some inspection pages first.', 'error');
                this.tabsSection.style.display = 'none';
                this.extractAllBtn.disabled = true;
                return;
            }

            this.displayTabsList();
            this.setBulkStatus(`Found ${this.inspectionTabs.length} inspection tab${this.inspectionTabs.length !== 1 ? 's' : ''}`, 'success');
            this.extractAllBtn.disabled = false;

        } catch (error) {
            this.setBulkStatus(`Error scanning tabs: ${error.message}`, 'error');
            console.error('Error:', error);
        }
    }
    
    displayTabsList() {
        this.tabsSection.style.display = 'block';
        this.tabsList.innerHTML = '';

        this.inspectionTabs.forEach((tab) => {
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
        const selectedCheckboxes = document.querySelectorAll('.tab-checkbox:checked');
        const selectedTabIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.tabId));
        
        if (selectedTabIds.length === 0) {
            this.setBulkStatus('Please select at least one inspection tab', 'error');
            return;
        }

        this.isBulkCancelled = false;
        this.extractedInspections = [];
        this.scanTabsBtn.disabled = true;
        this.extractAllBtn.style.display = 'none';
        this.cancelBulkBtn.style.display = 'inline-block';
        this.exportBulkBtn.disabled = true;
        this.showBulkProgress('Starting extraction...', 0);

        try {
            for (let i = 0; i < selectedTabIds.length; i++) {
                if (this.isBulkCancelled) {
                    throw new Error('Extraction cancelled');
                }

                const tabId = selectedTabIds[i];
                const tab = this.inspectionTabs.find(t => t.id === tabId);
                
                const progress = (i / selectedTabIds.length) * 100;
                this.updateBulkProgress(`Processing inspection ${i + 1} of ${selectedTabIds.length}...`, progress, '');

                try {
                    await chrome.tabs.update(tabId, { active: true });
                    await this.sleep(800);
                    
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['content.js']
                        });
                    } catch (scriptError) {
                        // Content script might already be loaded
                    }
                    
                    await this.sleep(300);
                    
                    this.updateBulkProgress(`Extracting from inspection ${i + 1} of ${selectedTabIds.length}...`, progress + (50 / selectedTabIds.length), 'Scanning items...');

                    const response = await chrome.tabs.sendMessage(tabId, { 
                        action: 'extractInspectionItems' 
                    });

                    if (response.success) {
                        const itemCount = response.items.length;
                        const incompleteCount = response.items.filter(item => !((item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== ''))).length;
                        
                        this.extractedInspections.push({
                            tabId: tabId,
                            title: tab.title,
                            url: tab.url,
                            items: response.items,
                            metadata: response.metadata || {}
                        });
                        
                        this.updateBulkProgress(
                            `Extracted inspection ${i + 1} of ${selectedTabIds.length}`, 
                            ((i + 1) / selectedTabIds.length) * 100,
                            `Found ${itemCount} items (${incompleteCount} incomplete)`
                        );
                    } else {
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
                    this.extractedInspections.push({
                        tabId: tabId,
                        title: tab.title,
                        url: tab.url,
                        items: [],
                        error: error.message || 'Extraction failed'
                    });
                }
                
                await this.sleep(300);
            }

            this.hideBulkProgress();
            this.displayBulkSummary();
            
            const successCount = this.extractedInspections.filter(i => !i.error && i.items.length > 0).length;
            const failCount = this.extractedInspections.length - successCount;
            
            if (failCount > 0) {
                this.setBulkStatus(`Extracted ${successCount} inspection${successCount !== 1 ? 's' : ''} (${failCount} failed)`, 'success');
            } else {
                this.setBulkStatus(`Successfully extracted ${successCount} inspection${successCount !== 1 ? 's' : ''}`, 'success');
            }

        } catch (error) {
            this.hideBulkProgress();
            this.setBulkStatus(`Error: ${error.message}`, 'error');
            console.error('Extraction error:', error);
        } finally {
            this.scanTabsBtn.disabled = false;
            this.extractAllBtn.style.display = 'inline-block';
            this.cancelBulkBtn.style.display = 'none';
        }
    }
    
    cancelBulkExtraction() {
        this.isBulkCancelled = true;
        this.setBulkStatus('Cancelling extraction...', 'loading');
    }
    
    displayBulkSummary() {
        if (this.extractedInspections.length === 0) {
            this.summarySection.style.display = 'none';
            return;
        }
        this.summarySection.style.display = 'block';
        this.exportBulkBtn.disabled = false;
        this.detailedReportBtn.disabled = false;
        
        // Save data to chrome storage for detailed report
        chrome.storage.local.set({ bulkInspectionData: this.extractedInspections });

        let totalItems = 0;
        let totalIncomplete = 0;
        const successfulInspections = this.extractedInspections.filter(i => !i.error);

        successfulInspections.forEach(inspection => {
            totalItems += inspection.items.length;
            inspection.items.forEach(item => {
                const isFilled = (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '');
                if (!isFilled) {
                    totalIncomplete++;
                }
            });
        });

        this.totalInspectionsSpan.textContent = successfulInspections.length;
        this.totalAllItemsSpan.textContent = totalItems;
        this.totalIncompleteSpan.textContent = totalIncomplete;

        this.displayBulkInspections();
    }
    
    displayBulkInspections() {
        this.inspectionsList.innerHTML = '';

        const filteredInspections = this.getFilteredBulkInspections();

        if (filteredInspections.length === 0) {
            this.inspectionsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-text">No inspections match the current filter.</div>
                </div>
            `;
            return;
        }

        filteredInspections.forEach((inspection) => {
            const card = this.createBulkInspectionCard(inspection);
            this.inspectionsList.appendChild(card);
        });
    }
    
    createBulkInspectionCard(inspection) {
        const card = document.createElement('div');
        card.className = 'inspection-card';

        if (inspection.error) {
            card.innerHTML = `
                <div class="inspection-header">
                    <div>
                        <div class="inspection-title">${this.escapeHtml(inspection.title)}</div>
                        <div class="inspection-url">${this.escapeHtml(inspection.url)}</div>
                    </div>
                    <div class="inspection-stats">
                        <div class="inspection-stat incomplete">
                            <span class="inspection-stat-value">⚠️</span>
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
            const isFilled = (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '');
            return !isFilled;
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
                        ${incompleteItems.map(item => this.createBulkItemRow(item)).join('')}
                    </div>
                ` : '<div class="empty-state-text">All items are complete! 🎉</div>'}
            </div>
        `;

        const header = card.querySelector('.inspection-header');
        header.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });

        return card;
    }
    
    createBulkItemRow(item) {
        const isFilled = (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '');
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
    
    getFilteredBulkInspections() {
        if (this.currentFilter === 'all') {
            return this.extractedInspections;
        } else if (this.currentFilter === 'incomplete') {
            return this.extractedInspections.filter(inspection => {
                if (inspection.error) return false;
                const incompleteCount = inspection.items.filter(item => {
                    const isFilled = (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '');
                    return !isFilled;
                }).length;
                return incompleteCount > 0;
            });
        } else if (this.currentFilter === 'complete') {
            return this.extractedInspections.filter(inspection => {
                if (inspection.error) return false;
                const incompleteCount = inspection.items.filter(item => {
                    const isFilled = (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '');
                    return !isFilled;
                }).length;
                return incompleteCount === 0 && inspection.items.length > 0;
            });
        }
        return this.extractedInspections;
    }
    
    applyBulkFilter(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.bulk-filter-btn').forEach(btn => {
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.displayBulkInspections();
    }
    
    exportBulkSummary() {
        if (this.extractedInspections.length === 0) {
            this.setBulkStatus('No data to export', 'error');
            return;
        }

        let csvContent = 'Inspection,Tab ID,URL,Item Number,Item Title,Status,Response,Error\n';

        this.extractedInspections.forEach(inspection => {
            if (inspection.error) {
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
                    const isFilled = (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '');
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

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-inspection-summary-${this.getTimestamp()}.csv`;
        document.body.appendChild(a);
        this.setBulkStatus('Summary exported successfully', 'success');
    }
    
    openDetailedReport() {
        chrome.tabs.create({
            url: chrome.runtime.getURL('src/pages/detailed-report/detailed-report.html')
        });
    }
    
    showBulkProgress(text, percent) {
        this.setBulkStatus('Summary exported successfully', 'success');
    }
    
    showBulkProgress(text, percent) {
        this.bulkProgressContainer.style.display = 'block';
        this.bulkProgressText.textContent = text;
        this.bulkProgressFill.style.width = percent + '%';
        this.bulkProgressDetails.textContent = '';
    }

    updateBulkProgress(text, percent, details) {
        this.bulkProgressText.textContent = text;
        this.bulkProgressFill.style.width = percent + '%';
        this.bulkProgressDetails.textContent = details || '';
    }

    hideBulkProgress() {
        this.bulkProgressContainer.style.display = 'none';
    }

    setBulkStatus(message, type = '') {
        this.bulkStatus.textContent = message;
        this.bulkStatus.className = 'bulk-status ' + type;
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
    
    escapeCsv(text) {
        if (typeof text !== 'string') {
            text = String(text);
        }
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            return '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
    }
}

// Initialize the panel when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InspectionFillerPanel();
});
