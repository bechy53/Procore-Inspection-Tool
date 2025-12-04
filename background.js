// Background service worker for Procore Inspection Filler

chrome.runtime.onInstalled.addListener(() => {
    console.log('Procore Inspection Filler installed');
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for messages from content script or side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'logError') {
        console.error('Error from content script:', request.error);
    } else if (request.action === 'downloadCSV') {
        // Handle CSV download
        const blob = new Blob([request.csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        chrome.downloads.download({
            url: url,
            filename: request.filename || 'inspection_items.csv',
            saveAs: true
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true, downloadId: downloadId });
            }
            URL.revokeObjectURL(url);
        });
        return true;
    }
    return true;
});
