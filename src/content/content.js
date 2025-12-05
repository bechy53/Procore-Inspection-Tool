// Content script for extracting and filling Procore inspection items

// Prevent multiple injections
if (typeof window.procoreInspectionHandlerLoaded === 'undefined') {
    window.procoreInspectionHandlerLoaded = true;

class ProcoreInspectionHandler {
    constructor() {
        this.extractionCancelled = false;
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'extractInspectionItems') {
                this.extractionCancelled = false;
                this.extractInspectionItems()
                    .then(result => {
                        if (sendResponse) {
                            sendResponse({ 
                                success: true, 
                                items: result.items, 
                                metadata: result.metadata,
                                url: window.location.href 
                            });
                        }
                    })
                    .catch(error => {
                        if (sendResponse) {
                            sendResponse({ success: false, error: error.message });
                        }
                    });
                return true;
            } else if (request.action === 'cancelExtraction') {
                this.extractionCancelled = true;
                if (sendResponse) {
                    sendResponse({ success: true });
                }
                return true;
            } else if (request.action === 'fillInspectionItems') {
                this.fillInspectionItems(request.items)
                    .then(result => {
                        if (sendResponse) {
                            sendResponse({ success: true, result: result });
                        }
                    })
                    .catch(error => {
                        if (sendResponse) {
                            sendResponse({ success: false, error: error.message });
                        }
                    });
                return true;
            } else if (request.action === 'scrollToItem') {
                this.scrollToItem(request.uniqueId, request.itemNumber, request.scrollToCenterPosition)
                    .then(() => {
                        if (sendResponse) {
                            sendResponse({ success: true });
                        }
                    })
                    .catch(error => {
                        if (sendResponse) {
                            sendResponse({ success: false, error: error.message });
                        }
                    });
                return true;
            } else if (request.action === 'scrollToBottom') {
                try {
                    // Find the largest scrollable container
                    let scrollElement = null;
                    let maxScrollHeight = 0;
                    
                    document.querySelectorAll('*').forEach(el => {
                        const hasVerticalScroll = el.scrollHeight > el.clientHeight;
                        if (hasVerticalScroll && el.scrollHeight > maxScrollHeight) {
                            const computedStyle = window.getComputedStyle(el);
                            const overflowY = computedStyle.overflowY;
                            // Only consider elements with actual scroll capability
                            if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'visible') {
                                maxScrollHeight = el.scrollHeight;
                                scrollElement = el;
                            }
                        }
                    });
                    
                    if (scrollElement) {
                        scrollElement.scrollTo({
                            top: scrollElement.scrollHeight,
                            behavior: 'smooth'
                        });
                    } else {
                        window.scrollTo({
                            top: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
                            behavior: 'smooth'
                        });
                    }
                    
                    if (sendResponse) {
                        sendResponse({ success: true });
                    }
                } catch (error) {
                    console.error('Error scrolling:', error);
                    if (sendResponse) {
                        sendResponse({ success: false, error: error.message });
                    }
                }
                return true;
            }
            return false; // Not handling this message
        });
    }

    scrollMainPageToBottom() {
        // Find the first (outermost) scrollable container - this is the main page
        let scrollElement = null;
        
        // Get all scrollable elements
        const scrollableElements = [];
        document.querySelectorAll('*').forEach(el => {
            const hasVerticalScroll = el.scrollHeight > el.clientHeight;
            if (hasVerticalScroll) {
                const computedStyle = window.getComputedStyle(el);
                const overflowY = computedStyle.overflowY;
                if (overflowY === 'auto' || overflowY === 'scroll') {
                    scrollableElements.push(el);
                }
            }
        });
        
        // Find the top-most scrollable element (least nested)
        let minDepth = Infinity;
        for (const el of scrollableElements) {
            let depth = 0;
            let parent = el.parentElement;
            while (parent) {
                depth++;
                parent = parent.parentElement;
            }
            if (depth < minDepth) {
                minDepth = depth;
                scrollElement = el;
            }
        }
        
        if (scrollElement) {
            scrollElement.scrollTo({
                top: scrollElement.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo({
                top: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
                behavior: 'smooth'
            });
        }
    }

    async extractInspectionItems() {
        // Wait for inspection items to load - look for the item rows
        await this.waitForElement('[data-qa="item-row"], [data-qa^="inspection-item"]', 10000);

        // Extract inspection metadata
        const metadata = this.extractInspectionMetadata();

        // Scroll to load all lazy-loaded items and collect them
        const items = await this.scrollToLoadAllItems();

        if (!items || items.length === 0) {
            throw new Error('No inspection items could be extracted. The page structure may have changed.');
        }

        // Add metadata to the response
        return {
            items: items,
            metadata: metadata
        };
    }
    
    extractInspectionMetadata() {
        const metadata = {
            inspectionName: '',
            location: '',
            inspectionNumber: '',
            inspectionType: '',
            status: '',
            inspectionDate: '',
            assignees: ''
        };
        
        // Extract inspection name from page title or breadcrumb
        const pageTitleElement = document.querySelector('[data-qa="page-title"]');
        if (pageTitleElement) {
            metadata.inspectionName = pageTitleElement.textContent.trim();
        }
        
        // Extract location
        const locationElement = document.querySelector('[data-qa="location-locations-picker"]');
        if (locationElement) {
            metadata.location = locationElement.textContent.trim();
        }
        
        // Extract inspection number
        const numberElement = document.querySelector('[data-qa="inspection-number"]');
        if (numberElement) {
            metadata.inspectionNumber = numberElement.textContent.trim();
        }
        
        // Extract inspection type
        const typeElement = document.querySelector('[data-qa="inspection-type"]');
        if (typeElement) {
            metadata.inspectionType = typeElement.textContent.trim();
        }
        
        // Extract status
        const statusElement = document.querySelector('[data-qa="inspection-status"]');
        if (statusElement) {
            metadata.status = statusElement.textContent.trim();
        }
        
        // Extract inspection date
        const dateElement = document.querySelector('[data-qa="inspection-date"]');
        if (dateElement) {
            const timeElement = dateElement.querySelector('time');
            metadata.inspectionDate = timeElement ? timeElement.textContent.trim() : dateElement.textContent.trim();
        }
        
        // Extract assignees
        const assigneesElement = document.querySelector('[data-qa="inspection-assignees"]');
        if (assigneesElement) {
            metadata.assignees = assigneesElement.textContent.trim();
        }
        
        return metadata;
    }

    async scrollToLoadAllItems() {
        // Find the scrollable container - specifically the inspection items list
        const scrollContainer = document.querySelector('[data-qa="section-item-list"]') || 
                               document.querySelector('[style*="overflow: auto"][style*="will-change: transform"]') ||
                               document.querySelector('.StyledListContainer-jPuloL') ||
                               Array.from(document.querySelectorAll('[style*="overflow: auto"]')).find(el => {
                                   return el.querySelector('[data-qa^="inspection-item-"]') || el.querySelector('[data-qa="item-row"]');
                               });

        if (!scrollContainer) {
            return;
        }
        
        // Find the scrollable viewport (direct child with overflow: auto)
        let scrollViewport = scrollContainer;
        let virtualHeightContainer = null;
        
        // Look for a child div with overflow and position relative
        const children = scrollContainer.children;
        for (let child of children) {
            const style = window.getComputedStyle(child);
            if (style.overflow === 'auto' || style.overflowY === 'auto') {
                scrollViewport = child;
                break;
            }
        }
        
        // Scroll to top first
        scrollViewport.scrollTop = 0;
        await this.sleep(200);
        
        // Now find the inner virtual scroll container (first child with large height)
        if (scrollViewport.children.length > 0) {
            const innerChild = scrollViewport.children[0];
            if (innerChild.style.height) {
                virtualHeightContainer = innerChild;
            }
        }
        
        const viewportHeight = scrollViewport.clientHeight;
        const virtualHeight = virtualHeightContainer && virtualHeightContainer.style.height 
            ? parseInt(virtualHeightContainer.style.height) 
            : scrollViewport.scrollHeight;
        
        // Store all unique items we find (since DOM items are recycled)
        const allItems = new Map(); // itemNumber -> itemData

        let previousCount = 0;
        let stableCount = 0;
        const maxAttempts = 200; // Increased for more items
        const scrollStep = 200; // Optimized for faster extraction

        for (let i = 0; i < maxAttempts; i++) {
            // Check for cancellation
            if (this.extractionCancelled) {
                throw new Error('Extraction cancelled');
            }
            
            // Extract currently visible items and add to our collection
            const visibleItems = document.querySelectorAll('[data-qa^="inspection-item-"]');
            
            visibleItems.forEach(itemElement => {
                const dataQa = itemElement.getAttribute('data-qa');
                const itemNumber = dataQa ? dataQa.replace('inspection-item-', '') : null;
                
                // Create a unique identifier using data-qa attribute
                const uniqueId = dataQa; // e.g., "inspection-item-1.1"
                
                if (uniqueId && !allItems.has(uniqueId)) {
                    // Get element's position relative to viewport
                    const rect = itemElement.getBoundingClientRect();
                    const viewportRect = scrollViewport.getBoundingClientRect();
                    const relativeTop = rect.top - viewportRect.top;
                    const elementCenter = relativeTop + (rect.height / 2);
                    
                    // Calculate scroll position that would center this item
                    const viewportHeight = scrollViewport.clientHeight;
                    const viewportCenter = viewportHeight / 2;
                    const scrollToCenter = scrollViewport.scrollTop + elementCenter - viewportCenter;
                    
                    // Extract and store this item's data with scroll position to center it
                    const itemData = this.extractItemData(itemElement, scrollToCenter, uniqueId);
                    if (itemData) {
                        allItems.set(uniqueId, itemData);
                    }
                }
            });
            
            const currentCount = allItems.size;
            
            // Calculate scroll progress
            const currentScroll = scrollViewport.scrollTop;
            const maxScroll = scrollViewport.scrollHeight - scrollViewport.clientHeight;
            const scrollPercent = maxScroll > 0 ? Math.round((currentScroll / maxScroll) * 100) : 100;
            
            // Send progress update to sidepanel
            if (i % 10 === 0) { // Every 10 iterations to avoid spam
                chrome.runtime.sendMessage({
                    action: 'extractionProgress',
                    text: `Extracting items... (${currentCount} found)`,
                    percent: Math.min(scrollPercent, 95) // Cap at 95% until complete
                });
            }
            
            // Scroll down incrementally
            if (maxScroll > 0 && currentScroll < maxScroll) {
                scrollViewport.scrollTop = Math.min(currentScroll + scrollStep, maxScroll);
                await this.sleep(50); // Short wait for rendering
            } else {
                // At bottom
                stableCount++;
                if (stableCount >= 2) {
                    break;
                }
                await this.sleep(150);
            }

            // Check if count is stable at bottom
            if (currentCount === previousCount && currentScroll >= (maxScroll - 10)) {
                stableCount++;
                if (stableCount >= 3) {
                    break;
                }
            } else if (currentCount > previousCount) {
                stableCount = 0;
            }

            previousCount = currentCount;
        }
        
        // Scroll back to top
        scrollViewport.scrollTop = 0;
        await this.sleep(500);
        
        // Return the collected items as an array
        return Array.from(allItems.values());

        // Scroll back to top
        scrollContainer.scrollTop = 0;
        await this.sleep(300);
    }

    extractItemData(element, scrollToCenterPosition, uniqueId) {
        // Create cache for DOM queries
        const cache = new Map();
        
        const getCached = (selector) => {
            if (!cache.has(selector)) {
                cache.set(selector, element.querySelector(selector));
            }
            return cache.get(selector);
        };
        
        // Get the item number from data-qa attribute (e.g., "inspection-item-1.1")
        const dataQa = element.getAttribute('data-qa');
        const itemNumber = dataQa ? dataQa.replace('inspection-item-', '') : null;
        
        // Find the item title/question text
        const titleElement = getCached('.StyledTypography-core-12_22_0__sc-1c4583t-0');
        const title = titleElement ? titleElement.textContent.trim() : `Item ${itemNumber}`;

        // Find current response - look for buttons with aria-label
        let currentValue = '';
        const responseButtons = element.querySelectorAll('[data-qa^="conforming-"], [data-qa^="non_conforming-"], [data-qa^="not_applicable-"]');
        responseButtons.forEach(btn => {
            const dataQa = btn.getAttribute('data-qa');
            const ariaLabel = btn.getAttribute('aria-label');
            
            // Check if button is in selected state by looking for -true suffix in data-qa
            // e.g., "conforming-true", "non_conforming-true", "not_applicable-true"
            if (dataQa && dataQa.endsWith('-true') && ariaLabel) {
                currentValue = ariaLabel;
            }
        });

        // Check for text input value
        let textValue = '';
        const textInput = getCached('[data-qa="item-text-input-textarea"]');
        if (textInput && textInput.value) {
            textValue = textInput.value.trim();
        }

        // Get available options from the response buttons
        const options = [];
        responseButtons.forEach(btn => {
            const label = btn.getAttribute('aria-label');
            if (label && !options.includes(label)) {
                options.push(label);
            }
        });

        return {
            uniqueId: uniqueId, // Full data-qa attribute for unique identification
            itemNumber: itemNumber,
            title: title,
            currentResponse: currentValue,
            textValue: textValue,
            availableOptions: options,
            scrollToCenterPosition: scrollToCenterPosition, // Exact scroll position to center this item
            elementPath: this.getElementPath(element)
        };
    }

    async fillInspectionItems(items) {
        console.log(`Filling ${items.length} items...`);
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        // Find the scrollable container - same as in extraction
        const scrollContainer = document.querySelector('[data-qa="section-item-list"]') || 
                               document.querySelector('[style*="overflow: auto"][style*="will-change: transform"]') ||
                               document.querySelector('.StyledListContainer-jPuloL') ||
                               Array.from(document.querySelectorAll('[style*="overflow: auto"]')).find(el => {
                                   return el.querySelector('[data-qa^="inspection-item-"]') || el.querySelector('[data-qa="item-row"]');
                               });

        if (!scrollContainer) {
            // Continue anyway, will fill whatever is visible
        }

        let scrollViewport = scrollContainer;
        if (scrollContainer) {
            const children = Array.from(scrollContainer.children);
            for (const child of children) {
                const computedStyle = window.getComputedStyle(child);
                if (computedStyle.overflow === 'auto' || computedStyle.overflowY === 'auto') {
                    scrollViewport = child;
                    break;
                }
            }
            
            // Scroll to top first
            scrollViewport.scrollTop = 0;
            await this.sleep(500);
        }

        // Create a map of items to fill by itemNumber
        const itemsToFill = new Map();
        items.forEach(item => {
            if (item.response && item.response.trim() !== '') {
                itemsToFill.set(item.itemNumber, item);
            }
        });

        // Scroll through and fill items as they become visible
        const maxAttempts = 200;
        const scrollStep = 100;
        let filledItems = new Set();

        for (let i = 0; i < maxAttempts; i++) {
            // Find currently visible items
            const visibleItems = document.querySelectorAll('[data-qa^="inspection-item-"]');
            
            for (const itemElement of visibleItems) {
                const dataQa = itemElement.getAttribute('data-qa');
                const itemNumber = dataQa ? dataQa.replace('inspection-item-', '') : null;
                
                if (itemNumber && itemsToFill.has(itemNumber) && !filledItems.has(itemNumber)) {
                    const itemToFill = itemsToFill.get(itemNumber);
                    
                    try {
                        const result = await this.fillSingleItem(itemElement, itemToFill);
                        if (result.filled) {
                            successCount++;
                        } else {
                            skippedCount++;
                        }
                        filledItems.add(itemNumber);
                        
                        // Send progress update
                        const progressPercent = Math.round((filledItems.size / itemsToFill.size) * 100);
                        chrome.runtime.sendMessage({
                            action: 'fillProgress',
                            text: `Filling items... (${filledItems.size}/${itemsToFill.size})`,
                            percent: Math.min(progressPercent, 95)
                        });
                        
                        await this.sleep(100);
                    } catch (error) {
                        console.error(`Error filling item ${itemNumber}:`, error);
                        errorCount++;
                        filledItems.add(itemNumber); // Mark as attempted
                    }
                }
            }

            // Check if we've filled all items
            if (filledItems.size >= itemsToFill.size) {
                break;
            }

            // Scroll down if scroll container exists
            if (scrollViewport) {
                const currentScroll = scrollViewport.scrollTop;
                const maxScroll = scrollViewport.scrollHeight - scrollViewport.clientHeight;
                
                if (currentScroll < maxScroll) {
                    scrollViewport.scrollTop = Math.min(currentScroll + scrollStep, maxScroll);
                    await this.sleep(100);
                }
            }
        }

        console.log(`Fill complete: ${successCount} filled, ${skippedCount} skipped, ${errorCount} errors`);
        return { successCount, skippedCount, errorCount, total: items.length };
    }

    async fillSingleItem(itemElement, item) {
        // Check current state to see if we need to fill
        let filled = false;

        const normalizedResponse = item.response.toLowerCase().trim();
        
        // First, check if this item has a text input field
        const textInput = itemElement.querySelector('[data-qa="item-text-input-textarea"]');
        
        if (textInput) {
            // This item has a text field
            if (normalizedResponse === 'na' || normalizedResponse === 'n/a' || normalizedResponse === 'not applicable') {
                // For text fields, if response is N/A, click the N/A button instead
                const selectedButton = itemElement.querySelector(`[data-qa="not_applicable-true"]`);
                if (!selectedButton) {
                    const button = itemElement.querySelector(`[data-qa^="not_applicable-"]`);
                    if (button) {
                        button.click();
                        filled = true;
                        await this.sleep(200);
                    }
                }
            } else {
                // For any other response, put it in the text field (including "Yes", "No", numbers, etc.)
                const currentValue = textInput.value.trim();
                if (currentValue !== item.response) {
                    textInput.value = item.response;
                    textInput.dispatchEvent(new Event('input', { bubbles: true }));
                    textInput.dispatchEvent(new Event('change', { bubbles: true }));
                    filled = true;
                    await this.sleep(200);
                }
            }
        } else {
            // No text field, this is a button-only response (Yes/No/N/A)
            let buttonPrefix = '';
            if (normalizedResponse === 'yes' || normalizedResponse === 'pass') {
                buttonPrefix = 'conforming';
            } else if (normalizedResponse === 'no' || normalizedResponse === 'fail') {
                buttonPrefix = 'non_conforming';
            } else if (normalizedResponse === 'na' || normalizedResponse === 'n/a' || normalizedResponse === 'not applicable') {
                buttonPrefix = 'not_applicable';
            }
            
            if (buttonPrefix) {
                // Check if already selected
                const selectedButton = itemElement.querySelector(`[data-qa="${buttonPrefix}-true"]`);
                if (!selectedButton) {
                    // Not selected, need to click
                    const button = itemElement.querySelector(`[data-qa^="${buttonPrefix}-"]`);
                    if (button) {
                        button.click();
                        filled = true;
                        await this.sleep(200);
                    }
                }
            }
        }

        return { filled };
    }

    getElementPath(element) {
        const path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            if (element.id) {
                selector += '#' + element.id;
                path.unshift(selector);
                break;
            } else {
                let sibling = element;
                let nth = 1;
                while (sibling.previousElementSibling) {
                    sibling = sibling.previousElementSibling;
                    if (sibling.nodeName.toLowerCase() === selector) nth++;
                }
                if (nth > 1) selector += ':nth-of-type(' + nth + ')';
            }
            path.unshift(selector);
            element = element.parentNode;
        }
        return path.join(' > ');
    }

    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for element: ${selector}`));
            }, timeout);
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async scrollToItem(uniqueId, itemNumber, scrollToCenterPosition) {
        // Find the scroll container
        const scrollContainer = document.querySelector('[data-qa="section-item-list"]') || 
                               document.querySelector('[style*="overflow: auto"][style*="will-change: transform"]') ||
                               document.querySelector('.StyledListContainer-jPuloL') ||
                               Array.from(document.querySelectorAll('[style*="overflow: auto"]')).find(el => {
                                   return el.querySelector('[data-qa^="inspection-item-"]') || el.querySelector('[data-qa="item-row"]');
                               });

        if (!scrollContainer) {
            throw new Error('Could not find scroll container');
        }

        let scrollViewport = scrollContainer;
        const children = Array.from(scrollContainer.children);
        for (const child of children) {
            const computedStyle = window.getComputedStyle(child);
            if (computedStyle.overflow === 'auto' || computedStyle.overflowY === 'auto') {
                scrollViewport = child;
                break;
            }
        }

        // First check if item is already visible using unique ID
        let targetElement = document.querySelector(`[data-qa="${uniqueId}"]`);
        
        if (targetElement) {
            // Item is already in DOM, scroll to it properly centered
            // Scroll main page to bottom to ensure inspection items are visible
            this.scrollMainPageToBottom();
            this.scrollToElement(targetElement, scrollViewport);
            return;
        }

        // Item not in DOM yet - check if we need to scroll down or if it's above current position
        const currentScroll = scrollViewport.scrollTop;
        
        if (scrollToCenterPosition <= currentScroll) {
            // Item is above current scroll position - just scroll up to it
            scrollViewport.scrollTop = scrollToCenterPosition;
            await this.sleep(100);
            
            // Check if item is now visible
            targetElement = document.querySelector(`[data-qa="${uniqueId}"]`);
            if (targetElement) {
                // Scroll main page to bottom to ensure inspection items are visible
                this.scrollMainPageToBottom();
                
                targetElement.style.backgroundColor = 'rgba(255, 165, 0, 0.3)';
                setTimeout(() => {
                    targetElement.style.backgroundColor = '';
                }, 2000);
                return;
            }
        } else {
            // Item is below current position - try scrolling directly to it first
            scrollViewport.scrollTop = scrollToCenterPosition;
            await this.sleep(200);
            
            // Check if item is now visible
            targetElement = document.querySelector(`[data-qa="${uniqueId}"]`);
            if (targetElement) {
                // Scroll main page to bottom to ensure inspection items are visible
                this.scrollMainPageToBottom();
                
                targetElement.style.backgroundColor = 'rgba(255, 165, 0, 0.3)';
                setTimeout(() => {
                    targetElement.style.backgroundColor = '';
                }, 2000);
                return;
            }
        }
        
        // Item still not visible - need to scroll to bottom to load all lazy-loaded items
        const initialHeight = scrollViewport.scrollHeight;
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
        
        // Wait for lazy loading to complete (faster checks)
        let heightStableCount = 0;
        let lastHeight = scrollViewport.scrollHeight;
        
        while (heightStableCount < 2) { // Reduced from 3 to 2 checks
            await this.sleep(150); // Reduced from 300ms to 150ms
            const currentHeight = scrollViewport.scrollHeight;
            
            if (currentHeight === lastHeight) {
                heightStableCount++;
            } else {
                heightStableCount = 0;
                scrollViewport.scrollTop = scrollViewport.scrollHeight; // Keep scrolling to bottom as it grows
            }
            lastHeight = currentHeight;
        }
        
        // Scroll to the logged position from extraction
        scrollViewport.scrollTop = scrollToCenterPosition;
        await this.sleep(200);
        
        // Scroll main page to bottom to ensure inspection items are visible
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        
        // Now find the item and verify it's visible
        targetElement = document.querySelector(`[data-qa="${uniqueId}"]`);
        
        if (!targetElement) {
            throw new Error(`Item ${itemNumber} not found even after loading all items`);
        }
        
        // Highlight the item
        targetElement.style.backgroundColor = 'rgba(255, 165, 0, 0.3)';
        setTimeout(() => {
            targetElement.style.backgroundColor = '';
        }, 2000);
    }

    scrollToElement(element, scrollViewport) {
        // Calculate position to scroll to center the element
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollViewport.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top;
        const targetScroll = scrollViewport.scrollTop + relativeTop - (scrollViewport.clientHeight / 2) + (elementRect.height / 2);
        
        // Smooth scroll to the element
        scrollViewport.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
        
        // Highlight the element briefly
        element.style.transition = 'all 0.3s ease';
        element.style.backgroundColor = 'rgba(245, 124, 0, 0.3)';
        element.style.transform = 'scale(1.02)';
        
        setTimeout(() => {
            element.style.backgroundColor = '';
            element.style.transform = '';
        }, 1000);
    }
}

// Initialize the handler only once
new ProcoreInspectionHandler();

} // End of injection guard
