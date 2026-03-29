// widget.js
// Injects a floating widget into the Jira page

(function () {
  'use strict';

  const STORAGE_KEY = 'jira-standup-state';
  const WIDGET_ID = 'jira-standup-widget';

  // Add styles to page
  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #${WIDGET_ID} * {
        color: inherit !important;
      }
      #${WIDGET_ID} input[type="checkbox"] {
        width: 18px !important;
        height: 18px !important;
        cursor: pointer !important;
        accent-color: #0052cc !important;
      }
      #${WIDGET_ID} input[type="text"] {
        color: #172b4d !important;
        background: white !important;
      }
      #${WIDGET_ID} input[type="text"]::placeholder {
        color: #6b778c !important;
      }
      #${WIDGET_ID} button[id*="custom"] {
        color: white !important;
        background: #0052cc !important;
      }
      #${WIDGET_ID} button[id*="start"] {
        color: white !important;
        background: #0052cc !important;
      }
      #${WIDGET_ID} button[id*="next"] {
        color: white !important;
        background: #6554c0 !important;
      }
      @keyframes confetti-bounce {
        from { transform: translateY(0) rotate(0deg); opacity: 1; }
        to { transform: translateY(10px) rotate(20deg); opacity: 0.6; }
      }
      .confetti-piece {
        animation: confetti-bounce 1.2s ease-in-out infinite alternate !important;
        display: inline-block !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Create widget DOM
  function createWidget() {
    console.log('[Standup Widget] createWidget called');
    addStyles();

    // Main widget container
    const widget = document.createElement('div');
    widget.id = WIDGET_ID;
    widget.style.cssText = 'position: fixed !important; bottom: 20px !important; right: 20px !important; width: 360px !important; max-height: 700px !important; background: white !important; border: 1px solid #dfe1e6 !important; border-radius: 6px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; z-index: 999999 !important; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif !important; font-size: 14px !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; margin: 0 !important; padding: 0 !important; color: #172b4d !important;';

    // Header
    const header = document.createElement('div');
    header.className = 'widget-header';
    header.style.cssText = 'padding: 12px 14px 10px; border-bottom: 1px solid #dfe1e6; background: #f4f5f7; user-select: none; cursor: move; display: flex; justify-content: space-between; align-items: center;';

    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1;';

    const icon = document.createElement('span');
    icon.textContent = '🎲';
    icon.style.fontSize = '18px';

    const title = document.createElement('h1');
    title.textContent = 'Standup';
    title.style.cssText = 'font-size: 15px; font-weight: 600; letter-spacing: -0.01em; margin: 0;';

    titleDiv.appendChild(icon);
    titleDiv.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.id = 'widget-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.cssText = 'background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px; color: #6b778c;';

    header.appendChild(titleDiv);
    header.appendChild(closeBtn);

    // Content area
    const content = document.createElement('div');
    content.id = 'widget-content';
    content.style.cssText = 'flex: 1; overflow-y: auto; padding: 14px;';

    widget.appendChild(header);
    widget.appendChild(content);

    console.log('[Standup Widget] Widget element created: SUCCESS');
    return widget;
  }

  // Make widget draggable
  function makeDraggable(widget) {
    const header = widget.querySelector('.widget-header');
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (e) => {
      offsetX = e.clientX - widget.getBoundingClientRect().left;
      offsetY = e.clientY - widget.getBoundingClientRect().top;

      function onMouseMove(moveEvent) {
        widget.style.bottom = 'auto';
        widget.style.right = 'auto';
        widget.style.left = (moveEvent.clientX - offsetX) + 'px';
        widget.style.top = (moveEvent.clientY - offsetY) + 'px';
      }

      function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  // Scrape assignees directly (same logic as content.js)
  function scrapeAssignees() {
    const assigneeMap = {};

    // Strategy 1: Extract from input[name="assignee"][aria-label] + get avatar
    document.querySelectorAll('input[name="assignee"][aria-label]').forEach(input => {
      const label = (input.getAttribute('aria-label') || '').trim();
      const match = label.match(/Filter assignees by (.+)/);
      if (match && match[1]) {
        const name = match[1];
        if (isValidAssignee(name)) {
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

  function isValidAssignee(name) {
    const lower = name.toLowerCase();
    return !lower.match(/^unassigned$|^unassign$|^none$|^no assignee$|^$|^unknown$|^bot$|^automation$/);
  }

  // Widget state
  let allAssignees = []; // scraped assignees
  let customAssignees = []; // custom names added by user
  let selectedAssignees = [];
  let phase = 'setup'; // setup, picking, complete
  let remainingPool = [];
  let pickedOrder = [];
  let currentlySelectedPerson = null; // track who's currently filtered on the board
  let dropdownSelectedNames = new Set(); // track which dropdown users we've selected

  // Load and display widget content
  function loadWidgetContent() {
    const content = document.getElementById('widget-content');

    // Try to expand dropdown if it exists
    const showMoreBtn = document.querySelector('button[data-testid*="assignee-filter-show-more"]');
    if (showMoreBtn && showMoreBtn.getAttribute('aria-expanded') === 'false') {
      showMoreBtn.click();
      setTimeout(() => {
        renderSetupUI();
      }, 800);
    } else {
      renderSetupUI();
    }

    function renderSetupUI(isFirstLoad = true) {
      // Only scrape on first load
      if (isFirstLoad) {
        allAssignees = scrapeAssignees();
      }

      if (!allAssignees || allAssignees.length === 0) {
        content.innerHTML = '<p style="color: #6b778c; text-align: center; padding: 20px;">No assignees found</p>';
        return;
      }

      // Combine scraped and custom assignees
      const assignees = [...allAssignees, ...customAssignees.map(name => ({ name, avatar: '' }))];
      selectedAssignees = assignees.map(a => a.name);

      let html = `
        <div style="margin-bottom: 10px; display: flex; gap: 4px; justify-content: space-between;">
          <button id="btn-all-widget" type="button" style="background: none; border: none; color: #0052cc !important; font-size: 12px; cursor: pointer; padding: 0; font-weight: 500;">All</button>
          <span style="color: #dfe1e6;">|</span>
          <button id="btn-none-widget" type="button" style="background: none; border: none; color: #0052cc !important; font-size: 12px; cursor: pointer; padding: 0; font-weight: 500;">None</button>
        </div>
        <ul id="assignee-list-widget" style="list-style: none; padding: 0; margin: 0; max-height: 200px; overflow-y: auto; border: 1px solid #dfe1e6; border-radius: 4px; margin-bottom: 10px;">
      `;

      assignees.forEach(item => {
        const name = item.name;
        const avatar = item.avatar || '';
        html += `
          <li style="display: flex; align-items: center; gap: 8px; padding: 10px 8px; border-bottom: 1px solid #dfe1e6; color: #172b4d;">
            <input type="checkbox" class="assignee-checkbox-widget" value="${name}" checked>
            ${avatar ? `<img src="${avatar}" alt="${name}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">` : ''}
            <span style="color: #172b4d;">${name}</span>
          </li>
        `;
      });

      html += `
        </ul>
        <div style="margin-bottom: 10px; display: flex; gap: 6px;">
          <input id="custom-name-widget" type="text" placeholder="Add custom name" style="flex: 1; padding: 8px 10px; font-size: 13px; border: 1px solid #dfe1e6; border-radius: 4px; color: #172b4d !important; background: white !important;">
          <button id="btn-add-custom-widget" type="button" style="padding: 8px 12px; background: #0052cc !important; color: white !important; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">Add</button>
        </div>
        <button id="btn-start-widget" type="button" style="width: 100%; padding: 10px; background: #0052cc !important; color: white !important; border: none; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer;">Start Standup</button>
      `;

      content.innerHTML = html;

      // Setup event listeners
      const btnAll = content.querySelector('#btn-all-widget');
      const btnNone = content.querySelector('#btn-none-widget');
      const btnStart = content.querySelector('#btn-start-widget');
      const btnAddCustom = content.querySelector('#btn-add-custom-widget');
      const customInput = content.querySelector('#custom-name-widget');
      const checkboxes = content.querySelectorAll('.assignee-checkbox-widget');

      btnAll.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = true);
      });

      btnNone.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = false);
      });

      btnAddCustom.addEventListener('click', () => {
        const name = customInput.value.trim();
        if (name && name.length >= 1) {
          customAssignees.push(name);
          customInput.value = '';
          renderSetupUI(false); // Don't rescrape, just re-render with new custom name
        }
      });

      customInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          btnAddCustom.click();
        }
      });

      btnStart.addEventListener('click', () => {
        const checked = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (checked.length > 0) {
          phase = 'picking';
          remainingPool = [...checked];
          pickedOrder = [];
          renderPickingUI();
        }
      });

      console.log('[Standup Widget] Setup UI rendered');
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function ensureDropdownExpanded(waitMs = 800) {
      const showMoreBtn = document.querySelector('button[data-testid*="assignee-filter-show-more"]');
      if (showMoreBtn && showMoreBtn.getAttribute('aria-expanded') === 'false') {
        showMoreBtn.click();
        await sleep(waitMs);
      }
    }

    async function toggleFilter(name, shouldSelect) {
      // Path A: visible avatar label
      const labels = document.querySelectorAll('span[data-testid*="ak-avatar--label"]');
      for (const label of labels) {
        if (label.textContent.trim() === name) {
          const clickableLabel = label.closest('label[data-testid*="assignee-filter-avatar"]');
          if (clickableLabel) {
            const cb = clickableLabel.querySelector('input[name="assignee"]');
            const isChecked = cb ? cb.checked : false;
            // Deselect: always click (bypass stale React cb.checked)
            // Select: only click if not already checked
            if (!shouldSelect || !isChecked) {
              clickableLabel.click();
            }
            return 'visible';
          }
        }
      }

      // Path B: dropdown row — ensure dropdown is open first
      await ensureDropdownExpanded(800);

      const titleItems = document.querySelectorAll('[data-item-title="true"]');
      for (const item of titleItems) {
        const lines = item.textContent.trim().split('\n').map(l => l.trim());
        if (lines.includes(name)) {
          const row = item.parentElement?.parentElement; // div → outermost span
          if (row) {
            row.click();
            return 'dropdown';
          }
        }
      }

      return null;
    }

    async function selectAssigneeFilter(name) {
      // Deselect previous person
      if (currentlySelectedPerson && currentlySelectedPerson !== name) {
        const prevType = await toggleFilter(currentlySelectedPerson, false);
        if (prevType === 'dropdown') dropdownSelectedNames.delete(currentlySelectedPerson);
        console.log('[Standup Widget] Deselected previous assignee filter:', currentlySelectedPerson);
        await sleep(100); // allow React to flush deselect before selecting
      }

      // Select new person
      const type = await toggleFilter(name, true);
      if (type === 'dropdown') dropdownSelectedNames.add(name);
      if (type !== null) {
        currentlySelectedPerson = name;
        console.log('[Standup Widget] Selected assignee filter for:', name);
      }
    }

    async function renderPickingUI() {
      if (remainingPool.length === 0) {
        phase = 'complete';
        renderCompleteUI();
        return;
      }

      // First time picking: uncheck all assignee filters
      if (pickedOrder.length === 0) {
        currentlySelectedPerson = null; // Reset tracked selection

        // Uncheck visible avatar labels (only if checked)
        document.querySelectorAll('label[data-testid*="assignee-filter-avatar"]').forEach(labelEl => {
          const cb = labelEl.querySelector('input[name="assignee"]');
          if (cb && cb.checked) {
            labelEl.click();
          }
        });

        // Uncheck dropdown items we previously selected (await each)
        for (const n of dropdownSelectedNames) {
          await toggleFilter(n, false);
        }
        dropdownSelectedNames.clear();
      }

      pickAndDisplay();

      function pickAndDisplay() {
        const idx = Math.floor(Math.random() * remainingPool.length);
        const winner = remainingPool[idx];
        remainingPool.splice(idx, 1);
        pickedOrder.push(winner);

        // Auto-select this assignee in the filter
        selectAssigneeFilter(winner);

        let html = `
          <div style="text-align: center; padding: 20px;">
            <p style="font-size: 12px; color: #6b778c; margin-bottom: 8px; text-transform: uppercase; font-weight: 600;">Picked</p>
            <p style="font-size: 24px; font-weight: 700; color: #36b37e; margin: 0;">${winner}</p>
            <p style="font-size: 12px; color: #6b778c; margin-top: 16px;">${remainingPool.length} of ${remainingPool.length + pickedOrder.length} remaining</p>
          </div>
          <button id="btn-next-widget" type="button" style="width: calc(100% - 28px); margin: 0 14px 14px 14px; padding: 10px; background: #6554c0 !important; color: white !important; border: none; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer;">
            ${remainingPool.length === 0 ? 'Finish Standup 🎉' : `Next Person (${remainingPool.length} left)`}
          </button>
        `;

        content.innerHTML = html;

        const btnNext = content.querySelector('#btn-next-widget');
        btnNext.addEventListener('click', () => {
          renderPickingUI();
        });
      }
    }

    function renderCompleteUI() {
      let html = `
        <div style="text-align: center; padding: 30px 20px; display: flex; flex-direction: column; align-items: center; gap: 20px;">
          <div style="display: flex; justify-content: center; gap: 6px; font-size: 32px; height: 50px; overflow: hidden;">
            <span class="confetti-piece" style="animation-delay: 0s;">🎉</span>
            <span class="confetti-piece" style="animation-delay: 0.15s;">🎊</span>
            <span class="confetti-piece" style="animation-delay: 0.3s;">✨</span>
            <span class="confetti-piece" style="animation-delay: 0.45s;">🎉</span>
            <span class="confetti-piece" style="animation-delay: 0.6s;">🎊</span>
          </div>
          <div>
            <p style="font-size: 22px; font-weight: 700; margin: 0; color: #172b4d;">Standup Complete!</p>
            <p style="font-size: 13px; color: #6b778c; margin: 8px 0 0 0;">Everyone's had their turn. Ship it! 🚀</p>
          </div>
        </div>
        <button id="btn-restart-widget" type="button" style="width: calc(100% - 28px); margin: 0 14px 14px 14px; padding: 10px; background: #f4f5f7 !important; color: #0052cc !important; border: 1px solid #0052cc; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer;">Start Over</button>
      `;

      content.innerHTML = html;

      const btnRestart = content.querySelector('#btn-restart-widget');
      btnRestart.addEventListener('click', () => {
        phase = 'setup';
        remainingPool = [];
        pickedOrder = [];
        customAssignees = []; // Clear custom names on restart
        currentlySelectedPerson = null; // Reset tracked selection
        dropdownSelectedNames.clear(); // Clear dropdown tracking on restart
        renderSetupUI(false); // Re-render but don't rescrape
      });
    }
  }

  // Show widget
  function showWidget() {
    console.log('[Standup Widget] showWidget called');

    // Check if already exists
    if (document.getElementById(WIDGET_ID)) {
      console.log('[Standup Widget] Widget already exists');
      return;
    }

    // Create and inject widget
    const widget = createWidget();
    console.log('[Standup Widget] Widget created:', widget);

    if (!document.body) {
      console.log('[Standup Widget] Document body not ready, waiting...');
      setTimeout(showWidget, 200);
      return;
    }

    document.body.appendChild(widget);
    console.log('[Standup Widget] Widget appended to body');

    // Make draggable
    makeDraggable(widget);

    // Load content
    loadWidgetContent();

    // Close button
    const closeBtn = widget.querySelector('#widget-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        widget.remove();
      });
    }
  }

  // Listen for messages from background script to toggle widget
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TOGGLE_WIDGET') {
      const existing = document.getElementById(WIDGET_ID);
      if (existing) {
        existing.remove();
      } else {
        showWidget();
      }
      sendResponse({ success: true });
    }
  });

  // Initialize: auto-show widget on Jira board pages
  function init() {
    const boardPattern = /\/jira\/software\/.+\/projects\/.+\/board/;
    console.log('[Standup Widget] Checking URL:', window.location.pathname);
    console.log('[Standup Widget] Matches pattern?', boardPattern.test(window.location.pathname));

    if (boardPattern.test(window.location.pathname)) {
      console.log('[Standup Widget] Showing widget...');
      setTimeout(showWidget, 500); // Wait a bit for page to fully load
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
