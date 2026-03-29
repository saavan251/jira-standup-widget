// background.js
// Handles extension icon click to toggle widget on the current tab

chrome.action.onClicked.addListener((tab) => {
  // Send message to content script to toggle the widget
  chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_WIDGET' }).catch(() => {
    // Content script not loaded, just show a notification
    console.log('Content script not active on this tab');
  });
});
