// window-closer.js
// Handles the close button for the floating window

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      chrome.windows.getCurrent((win) => {
        chrome.windows.remove(win.id);
      });
    });
  }
});
