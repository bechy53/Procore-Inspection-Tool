// Detailed Report - Generate comprehensive inspection report

class DetailedReport {
    constructor() {
        this.reportData = null;
        this.filteredData = null;
        this.statusFilter = 'all';
        this.responseFilter = 'all';
        this.searchQuery = '';
        
        // Comparison data
        this.reportA = null;
        this.reportB = null;
        this.comparisonResults = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadData();
    }

    initializeElements() {
        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.reportTab = document.getElementById('reportTab');
        this.multiCompareTab = document.getElementById('multiCompareTab');
        
        // Report tab elements
        this.printBtn = document.getElementById('printBtn');
        this.exportDetailedBtn = document.getElementById('exportDetailedBtn');
        this.exportJsonBtn = document.getElementById('exportJsonBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.statusFilter = document.getElementById('statusFilter');
        this.responseFilter = document.getElementById('responseFilter');
        this.searchInput = document.getElementById('searchInput');
        this.reportContent = document.getElementById('reportContent');
        this.noData = document.getElementById('noData');
        
        // Overview elements
        this.overviewInspections = document.getElementById('overviewInspections');
        this.overviewItems = document.getElementById('overviewItems');
        this.overviewIncomplete = document.getElementById('overviewIncomplete');
        this.overviewComplete = document.getElementById('overviewComplete');
        this.overviewRate = document.getElementById('overviewRate');
        
        // Multi-compare tab elements
        this.goldenInspectionSelect = document.getElementById('goldenInspectionSelect');
        this.goldenInfo = document.getElementById('goldenInfo');
        this.compareInspectionsList = document.getElementById('compareInspectionsList');
        this.runMultiCompareBtn = document.getElementById('runMultiCompareBtn');
        this.exportMultiComparisonBtn = document.getElementById('exportMultiComparisonBtn');
        this.multiComparisonResults = document.getElementById('multiComparisonResults');
        this.multiComparisonFilter = document.getElementById('multiComparisonFilter');
        this.multiComparisonContent = document.getElementById('multiComparisonContent');
        this.goldenInspectionName = document.getElementById('goldenInspectionName');
        this.multiTotalCompared = document.getElementById('multiTotalCompared');
        this.multiTotalItems = document.getElementById('multiTotalItems');
        this.multiAllMatch = document.getElementById('multiAllMatch');
        this.multiSomeDiffer = document.getElementById('multiSomeDiffer');
        this.multiAllDiffer = document.getElementById('multiAllDiffer');
    }

    attachEventListeners() {
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Report tab listeners
        this.printBtn.addEventListener('click', () => window.print());
        this.exportDetailedBtn.addEventListener('click', () => this.exportDetailedCSV());
        this.exportJsonBtn.addEventListener('click', () => this.exportJson());
        this.refreshBtn.addEventListener('click', () => this.loadData());
        this.statusFilter.addEventListener('change', () => this.applyFilters());
        this.responseFilter.addEventListener('change', () => this.applyFilters());
        this.searchInput.addEventListener('input', () => this.applyFilters());
        
        // Multi-compare tab listeners
        this.goldenInspectionSelect.addEventListener('change', () => this.handleGoldenSelect());
        this.runMultiCompareBtn.addEventListener('click', () => this.performMultiComparison());
        this.exportMultiComparisonBtn.addEventListener('click', () => this.exportMultiComparison());
        this.multiComparisonFilter.addEventListener('change', () => this.renderMultiComparisonResults());
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update tab content
        if (tabName === 'report') {
            this.reportTab.classList.add('active');
            this.multiCompareTab.classList.remove('active');
        } else if (tabName === 'multiCompare') {
            this.reportTab.classList.remove('active');
            this.multiCompareTab.classList.add('active');
            this.loadMultiCompareSelects();
        }
    }
    
    async loadData() {
        try {
            // Get data from chrome storage
            const result = await chrome.storage.local.get(['bulkInspectionData']);
            
            if (!result.bulkInspectionData || result.bulkInspectionData.length === 0) {
                this.showNoData();
                return;
            }

            this.reportData = result.bulkInspectionData;
            this.filteredData = this.reportData;
            this.generateReport();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNoData();
        }
    }

    showNoData() {
        this.reportContent.style.display = 'none';
        this.noData.style.display = 'block';
    }

    generateReport() {
        this.reportContent.style.display = 'block';
        this.noData.style.display = 'none';

        // Calculate overview statistics
        let totalItems = 0;
        let completeItems = 0;
        let incompleteItems = 0;
        const successfulInspections = this.reportData.filter(i => !i.error);

        successfulInspections.forEach(inspection => {
            inspection.items.forEach(item => {
                totalItems++;
                const isFilled = (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '');
                if (isFilled) {
                    completeItems++;
                } else {
                    incompleteItems++;
                }
            });
        });

        const completionRate = totalItems > 0 ? Math.round((completeItems / totalItems) * 100) : 0;

        // Update overview cards
        this.overviewInspections.textContent = successfulInspections.length;
        this.overviewItems.textContent = totalItems;
        this.overviewIncomplete.textContent = incompleteItems;
        this.overviewComplete.textContent = completeItems;
        this.overviewRate.textContent = completionRate + '%';

        // Generate detailed sections
        this.renderDetailedSections();
    }

    applyFilters() {
        const statusValue = this.statusFilter.value;
        const responseValue = this.responseFilter.value;
        const searchValue = this.searchInput.value.toLowerCase().trim();

        this.filteredData = this.reportData.filter(inspection => {
            if (inspection.error) return false;

            // Filter items based on criteria
            const filteredItems = inspection.items.filter(item => {
                // Status filter
                if (statusValue === 'incomplete' && ((item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== ''))) {
                    return false;
                }
                if (statusValue === 'complete' && !((item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== ''))) {
                    return false;
                }

                // Response filter
                if (responseValue !== 'all') {
                    const response = (item.currentResponse || '').toLowerCase();
                    if (responseValue === 'yes' && !response.includes('yes') && !response.includes('pass')) {
                        return false;
                    }
                    if (responseValue === 'no' && !response.includes('no') && !response.includes('fail')) {
                        return false;
                    }
                    if (responseValue === 'na' && !response.includes('n/a') && !response.includes('na')) {
                        return false;
                    }
                    if (responseValue === 'blank' && response !== '') {
                        return false;
                    }
                }

                // Search filter
                if (searchValue && !item.title.toLowerCase().includes(searchValue)) {
                    return false;
                }

                return true;
            });

            // Only include inspection if it has filtered items
            if (filteredItems.length > 0) {
                inspection.filteredItems = filteredItems;
                return true;
            }
            return false;
        });

        this.renderDetailedSections();
    }

    renderDetailedSections() {
        this.reportContent.innerHTML = '';

        const dataToRender = this.filteredData.length > 0 ? this.filteredData : this.reportData;

        dataToRender.forEach(inspection => {
            if (inspection.error) return;

            const itemsToShow = inspection.filteredItems || inspection.items;
            if (itemsToShow.length === 0) return;

            const section = document.createElement('div');
            section.className = 'inspection-section';

            const completeCount = itemsToShow.filter(item => (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '')).length;
            const totalCount = itemsToShow.length;
            const progressPercent = totalCount > 0 ? (completeCount / totalCount) * 100 : 0;
            section.innerHTML = `
                <div class="inspection-header-detailed">
                    <div class="inspection-title-main">${this.escapeHtml(inspection.metadata?.inspectionName || inspection.title || 'Unnamed Inspection')}</div>
                    <div class="inspection-location">${this.escapeHtml(inspection.metadata?.location || '')}</div>
                    <div class="inspection-meta">
                        <div class="meta-item">
                            <span class="meta-label">URL:</span>
                            <span>${this.escapeHtml(inspection.url)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Tab ID:</span>
                            <span>${inspection.tabId}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Total Items:</span>
                            <span>${totalCount}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Complete:</span>
                            <span style="color: #4caf50;">${completeCount}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Incomplete:</span>
                            <span style="color: #ff9800;">${totalCount - completeCount}</span>
                        </div>
                    </div>div>
                    </div>
                    <div class="inspection-progress">
                        <div class="progress-bar-detailed">
                            <div class="progress-fill-detailed" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="progress-text-detailed">${Math.round(progressPercent)}% Complete</div>
                    </div>
                </div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item #</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Response</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsToShow.map(item => this.createItemRow(item)).join('')}
                    </tbody>
                </table>
            `;

            this.reportContent.appendChild(section);
        });

        if (this.reportContent.children.length === 0) {
            this.reportContent.innerHTML = '<div class="no-data"><p>No items match the current filters.</p></div>';
        }
    }

    createItemRow(item) {
        const isFilled = (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '');
        const statusClass = isFilled ? 'status-complete' : 'status-incomplete';
        const statusText = isFilled ? 'Complete' : 'Incomplete';
        
        let responseText = '-';
        let responseClass = 'response-blank';
        
        if (item.currentResponse) {
            responseText = item.currentResponse;
            const responseLower = responseText.toLowerCase();
            if (responseLower.includes('yes') || responseLower.includes('pass')) {
                responseClass = 'response-yes';
            } else if (responseLower.includes('no') || responseLower.includes('fail')) {
                responseClass = 'response-no';
            } else {
                responseClass = 'response-na';
            }
        } else if (item.textValue) {
            responseText = item.textValue;
            responseClass = 'response-na';
        }

        return `
            <tr>
                <td class="item-number-cell">${this.escapeHtml(item.itemNumber || '#' + (item.index + 1))}</td>
                <td class="item-title-cell">${this.escapeHtml(item.title)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="response-cell ${responseClass}">${this.escapeHtml(responseText)}</td>
            </tr>
        `;
    }

    exportDetailedCSV() {
        let csvContent = 'Inspection Title,Tab ID,URL,Item Number,Item Description,Status,Response,Item Index\n';

        this.reportData.forEach(inspection => {
            if (inspection.error) return;

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
                    item.index || ''
                ].join(',');
                
                csvContent += row + '\n';
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detailed-inspection-report-${this.getTimestamp()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    exportJson() {
        if (!this.reportData || this.reportData.length === 0) {
            alert('No report data to export');
            return;
        }
        
        const jsonString = JSON.stringify(this.reportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inspection-report-${this.getTimestamp()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
    
    // Multi-Comparison Methods
    
    loadMultiCompareSelects() {
        chrome.storage.local.get(['bulkInspectionData'], (result) => {
            const inspections = result.bulkInspectionData || [];
            
            if (inspections.length === 0) {
                this.goldenInspectionSelect.innerHTML = '<option value="">No inspections extracted</option>';
                this.compareInspectionsList.innerHTML = '<div class="no-data"><p>No inspections available. Please run the Bulk Inspector first.</p></div>';
                return;
            }
            
            // Populate golden inspection select
            const optionsHTML = '<option value="">Select the golden/control inspection...</option>' + 
                inspections.map((insp, index) => {
                    const name = insp.metadata?.inspectionName || `Inspection ${insp.tabId || index + 1}`;
                    const location = insp.metadata?.location || '';
                    const label = location ? `${name} - ${location}` : name;
                    return `<option value="${index}">${this.escapeHtml(label)}</option>`;
                }).join('');
            
            this.goldenInspectionSelect.innerHTML = optionsHTML;
            
            // Populate checkboxes for compare inspections
            this.compareInspectionsList.innerHTML = inspections.map((insp, index) => {
                const name = insp.metadata?.inspectionName || `Inspection ${insp.tabId || index + 1}`;
                const location = insp.metadata?.location || '';
                const label = location ? `${name} - ${location}` : name;
                const itemCount = insp.items?.length || 0;
                const completedCount = insp.items?.filter(item => 
                    (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '')
                ).length || 0;
                
                return `
                    <div class="compare-inspection-item">
                        <input type="checkbox" id="compare_${index}" value="${index}" class="compare-checkbox">
                        <label for="compare_${index}" class="compare-label">
                            <div class="compare-name">${this.escapeHtml(label)}</div>
                            <div class="compare-stats">${itemCount} items (${completedCount} complete)</div>
                        </label>
                    </div>
                `;
            }).join('');
            
            // Add change listeners to checkboxes
            document.querySelectorAll('.compare-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', () => this.updateMultiCompareButton());
            });
        });
    }
    
    handleGoldenSelect() {
        const index = this.goldenInspectionSelect.value;
        
        if (!index) {
            this.goldenInspection = null;
            this.goldenInfo.innerHTML = '';
            this.goldenInfo.className = 'report-info golden-info';
            this.updateMultiCompareButton();
            return;
        }
        
        chrome.storage.local.get(['bulkInspectionData'], (result) => {
            const inspections = result.bulkInspectionData || [];
            const inspection = inspections[parseInt(index)];
            
            if (!inspection) return;
            
            this.goldenInspection = inspection;
            
            const totalItems = inspection.items?.length || 0;
            const completeItems = inspection.items?.filter(item => 
                (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '')
            ).length || 0;
            const completionRate = totalItems > 0 ? Math.round((completeItems / totalItems) * 100) : 0;
            const inspName = inspection.metadata?.inspectionName || 'Unnamed Inspection';
            
            this.goldenInfo.className = 'report-info golden-info loaded';
            this.goldenInfo.innerHTML = `
                <strong>${inspName}</strong><br>
                Items: ${totalItems} | Complete: ${completeItems} (${completionRate}%)
            `;
            
            this.updateMultiCompareButton();
        });
    }
    
    updateMultiCompareButton() {
        const selectedCheckboxes = document.querySelectorAll('.compare-checkbox:checked');
        const hasGolden = this.goldenInspection != null;
        const hasCompare = selectedCheckboxes.length > 0;
        
        this.runMultiCompareBtn.disabled = !(hasGolden && hasCompare);
    }
    
    performMultiComparison() {
        if (!this.goldenInspection) {
            alert('Please select a golden inspection');
            return;
        }
        
        const selectedCheckboxes = document.querySelectorAll('.compare-checkbox:checked');
        const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
        
        if (selectedIndices.length === 0) {
            alert('Please select at least one inspection to compare');
            return;
        }
        
        chrome.storage.local.get(['bulkInspectionData'], (result) => {
            const inspections = result.bulkInspectionData || [];
            const compareInspections = selectedIndices.map(i => inspections[i]).filter(insp => insp != null);
            
            this.runMultiCompare(this.goldenInspection, compareInspections);
        });
    }
    
    runMultiCompare(goldenInspection, compareInspections) {
        // Build map for golden inspection items
        const goldenMap = new Map();
        (goldenInspection.items || []).forEach((item, index) => {
            const itemKey = item.itemNumber || index.toString();
            goldenMap.set(itemKey, {
                item: item,
                response: item.currentResponse || item.textValue || '',
                isFilled: (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '')
            });
        });
        
        // For each item in golden, compare across all inspections
        const comparisonResults = [];
        
        goldenMap.forEach((goldenData, itemKey) => {
            const itemComparison = {
                itemNumber: goldenData.item.itemNumber || itemKey,
                itemTitle: goldenData.item.title,
                goldenResponse: goldenData.response,
                goldenFilled: goldenData.isFilled,
                comparisons: [],
                matchCount: 0,
                differCount: 0,
                missingCount: 0
            };
            
            // Compare this item across all compare inspections
            compareInspections.forEach(inspection => {
                const inspectionMap = new Map();
                (inspection.items || []).forEach((item, index) => {
                    const key = item.itemNumber || index.toString();
                    inspectionMap.set(key, {
                        item: item,
                        response: item.currentResponse || item.textValue || '',
                        isFilled: (item.currentResponse && item.currentResponse !== '') || (item.textValue && item.textValue !== '')
                    });
                });
                
                const compareData = inspectionMap.get(itemKey);
                
                if (!compareData) {
                    // Item missing in this inspection
                    itemComparison.comparisons.push({
                        inspectionName: inspection.metadata?.inspectionName || 'Unnamed',
                        response: '',
                        isFilled: false,
                        status: 'missing'
                    });
                    itemComparison.missingCount++;
                } else if (goldenData.response === compareData.response) {
                    // Responses match
                    itemComparison.comparisons.push({
                        inspectionName: inspection.metadata?.inspectionName || 'Unnamed',
                        response: compareData.response,
                        isFilled: compareData.isFilled,
                        status: 'match'
                    });
                    itemComparison.matchCount++;
                } else {
                    // Responses differ
                    itemComparison.comparisons.push({
                        inspectionName: inspection.metadata?.inspectionName || 'Unnamed',
                        response: compareData.response,
                        isFilled: compareData.isFilled,
                        status: 'differ'
                    });
                    itemComparison.differCount++;
                }
            });
            
            // Determine overall status for this item
            const totalCompare = compareInspections.length;
            if (itemComparison.matchCount === totalCompare) {
                itemComparison.overallStatus = 'allMatch';
            } else if (itemComparison.differCount === totalCompare || itemComparison.missingCount === totalCompare) {
                itemComparison.overallStatus = 'allDiffer';
            } else {
                itemComparison.overallStatus = 'someDiffer';
            }
            
            comparisonResults.push(itemComparison);
        });
        
        this.multiComparisonData = {
            golden: goldenInspection,
            compareInspections: compareInspections,
            results: comparisonResults
        };
        
        this.displayMultiComparisonSummary();
        this.renderMultiComparisonResults();
        
        this.multiComparisonResults.style.display = 'block';
        this.exportMultiComparisonBtn.style.display = 'inline-block';
    }
    
    displayMultiComparisonSummary() {
        const results = this.multiComparisonData.results;
        const goldenName = this.multiComparisonData.golden.metadata?.inspectionName || 'Golden Inspection';
        const compareCount = this.multiComparisonData.compareInspections.length;
        
        const allMatchCount = results.filter(r => r.overallStatus === 'allMatch').length;
        const someDifferCount = results.filter(r => r.overallStatus === 'someDiffer').length;
        const allDifferCount = results.filter(r => r.overallStatus === 'allDiffer').length;
        
        this.goldenInspectionName.textContent = goldenName;
        this.multiTotalCompared.textContent = compareCount;
        this.multiTotalItems.textContent = results.length;
        this.multiAllMatch.textContent = allMatchCount;
        this.multiSomeDiffer.textContent = someDifferCount;
        this.multiAllDiffer.textContent = allDifferCount;
    }
    
    renderMultiComparisonResults() {
        if (!this.multiComparisonData) return;
        
        const filterValue = this.multiComparisonFilter.value;
        const results = this.multiComparisonData.results;
        
        let filteredResults = results;
        if (filterValue !== 'all') {
            if (filterValue === 'missingInSome') {
                filteredResults = results.filter(r => r.missingCount > 0);
            } else {
                filteredResults = results.filter(r => r.overallStatus === filterValue);
            }
        }
        
        if (filteredResults.length === 0) {
            this.multiComparisonContent.innerHTML = `
                <div class="no-changes">
                    <h3>No Items Found</h3>
                    <p>No items match the selected filter.</p>
                </div>
            `;
            return;
        }
        
        this.multiComparisonContent.innerHTML = filteredResults.map(item => this.createMultiComparisonItem(item)).join('');
    }
    
    createMultiComparisonItem(itemComparison) {
        let badgeClass, badgeText, statusIcon;
        
        switch(itemComparison.overallStatus) {
            case 'allMatch':
                badgeClass = 'all-match';
                badgeText = 'All Match';
                statusIcon = '✓';
                break;
            case 'someDiffer':
                badgeClass = 'some-differ';
                badgeText = 'Some Differ';
                statusIcon = '≈';
                break;
            case 'allDiffer':
                badgeClass = 'all-differ';
                badgeText = 'All Differ';
                statusIcon = 'X';
                break;
        }
        
        return `
            <div class="multi-change-item ${itemComparison.overallStatus === 'allMatch' ? 'all-match-item' : ''}">
                <div class="multi-change-header">
                    <div>
                        <div class="multi-change-title">${this.escapeHtml(itemComparison.itemTitle)}</div>
                        <div style="font-size: 13px; color: #b0b3b8; margin-top: 4px;">
                            Item ${this.escapeHtml(itemComparison.itemNumber)}
                        </div>
                    </div>
                    <span class="multi-change-badge ${badgeClass}">${statusIcon} ${badgeText}</span>
                </div>
                <div class="multi-change-details">
                    <div class="golden-response-row">
                        <div class="response-label">Golden Response:</div>
                        <div class="response-value golden-value">${this.escapeHtml(itemComparison.goldenResponse) || '<em>Empty</em>'}</div>
                    </div>
                    <div class="comparisons-grid">
                        ${itemComparison.comparisons.map(comp => this.createComparisonResponseCell(comp)).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    createComparisonResponseCell(comparison) {
        let statusClass = '';
        let statusIcon = '';
        
        switch(comparison.status) {
            case 'match':
                statusClass = 'match-status';
                statusIcon = '✓';
                break;
            case 'differ':
                statusClass = 'differ-status';
                statusIcon = '≠';
                break;
            case 'missing':
                statusClass = 'missing-status';
                statusIcon = '?';
                break;
        }
        
        return `
            <div class="comparison-cell ${statusClass}">
                <div class="cell-inspection-name">${statusIcon} ${this.escapeHtml(comparison.inspectionName)}</div>
                <div class="cell-response">${this.escapeHtml(comparison.response) || '<em>Empty/Missing</em>'}</div>
            </div>
        `;
    }
    
    exportMultiComparison() {
        if (!this.multiComparisonData || !this.multiComparisonData.results) {
            alert('No comparison data to export');
            return;
        }
        
        const goldenName = this.multiComparisonData.golden.metadata?.inspectionName || 'Golden';
        const inspectionNames = this.multiComparisonData.compareInspections.map(insp => 
            insp.metadata?.inspectionName || 'Unnamed'
        );
        
        // CSV Header
        let csvContent = `Item Number,Item Description,Overall Status,Golden Response (${goldenName})`;
        inspectionNames.forEach(name => {
            csvContent += `,${name} Response,${name} Status`;
        });
        csvContent += '\n';
        
        // CSV Rows
        this.multiComparisonData.results.forEach(itemComp => {
            let row = [
                this.escapeCsv(itemComp.itemNumber),
                this.escapeCsv(itemComp.itemTitle),
                itemComp.overallStatus,
                this.escapeCsv(itemComp.goldenResponse || '(Empty)')
            ];
            
            itemComp.comparisons.forEach(comp => {
                row.push(this.escapeCsv(comp.response || '(Empty/Missing)'));
                row.push(comp.status);
            });
            
            csvContent += row.join(',') + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `multi-inspection-comparison-${this.getTimestamp()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DetailedReport();
});
