// content.js
// Injected at document_idle on matching Jira board URLs.
// Listens for { action: "SCRAPE_ASSIGNEES" } from popup.js,
// responds with { assignees: string[] } or { error: string }.

(function () {
  'use strict';

  function isValidAssignee(name) {
    const lower = name.toLowerCase();
    return !lower.match(/^unassigned$|^unassign$|^none$|^no assignee$|^$|^unknown$|^bot$|^automation$/);
  }

  function scrapeAssignees() {
    const assigneeMap = {}; // { name: { avatar: url } }

    // Strategy 1: Extract from input[name="assignee"][aria-label] + get avatar
    document.querySelectorAll('input[name="assignee"][aria-label]').forEach(input => {
      const label = (input.getAttribute('aria-label') || '').trim();
      const match = label.match(/Filter assignees by (.+)/);
      if (match && match[1]) {
        const name = match[1];
        if (isValidAssignee(name)) {
          // Find the avatar image in the nearby elements
          const avatarImg = input.closest('div')?.querySelector('img[alt=""]');
          const avatarUrl = avatarImg?.src || '';
          assigneeMap[name] = { avatar: avatarUrl };
        }
      }
    });

    // Strategy 2: Extract from spans with ak-avatar--label data-testid
    document.querySelectorAll('span[data-testid*="ak-avatar--label"]').forEach(span => {
      const text = (span.textContent || '').trim();
      if (text && text.length >= 2 && /[a-zA-Z]/.test(text) && isValidAssignee(text)) {
        if (!assigneeMap[text]) {
          assigneeMap[text] = { avatar: '' };
        }
      }
    });

    // Strategy 3: Extract from dropdown items (data-item-title="true")
    document.querySelectorAll('[data-item-title="true"]').forEach(item => {
      const text = (item.textContent || '').trim();
      const lines = text.split('\n').map(l => l.trim()).filter(l =>
        l && l.length >= 2 && l.length <= 50 && /[a-zA-Z]/.test(l) && isValidAssignee(l)
      );
      lines.forEach(line => {
        if (!assigneeMap[line]) {
          // Try to find avatar in this item
          const avatarImg = item.querySelector('img[alt=""]');
          const avatarUrl = avatarImg?.src || '';
          assigneeMap[line] = { avatar: avatarUrl };
        }
      });
    });

    return Object.keys(assigneeMap).sort().map(name => ({
      name,
      avatar: assigneeMap[name].avatar
    }));
  }

  // Respond to messages from popup.js
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action !== 'SCRAPE_ASSIGNEES') return false;

    try {
      // First, try to expand the "show more" dropdown button if it exists
      const showMoreBtn = document.querySelector(
        'button[data-testid*="assignee-filter-show-more"]'
      );
      if (showMoreBtn && showMoreBtn.getAttribute('aria-expanded') === 'false') {
        showMoreBtn.click();
        // Wait longer for dropdown menu to fully render and populate
        setTimeout(() => {
          try {
            const assignees = scrapeAssignees();
            sendResponse({ assignees });
          } catch (err) {
            sendResponse({ error: err.message });
          }
        }, 800);
      } else {
        // No dropdown to expand, scrape immediately
        const assignees = scrapeAssignees();
        sendResponse({ assignees });
      }
    } catch (err) {
      sendResponse({ error: err.message });
    }

    return true; // keep channel open for async response
  });
})();
