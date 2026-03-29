// Injects a floating widget into the Jira page

(function () {
  'use strict';

  const WIDGET_ID = 'jira-standup-widget';

  // Add styles to page
  function addStyles() {
    // Skip if styles already added
    if (document.getElementById('standup-widget-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'standup-widget-styles';
    style.textContent = `
      #${WIDGET_ID} * {
        color: inherit !important;
      }
      #${WIDGET_ID} a {
        color: #6b778c !important;
        text-decoration: none !important;
      }
      #${WIDGET_ID} input[type="checkbox"] {
        width: 18px !important;
        height: 18px !important;
        cursor: pointer !important;
        accent-color: #0052cc !important;
      }
      #${WIDGET_ID} button[id*="start"] {
        color: white !important;
        background: #6554c0 !important;
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
      @keyframes pop-in {
        0%   { transform: scale(0.7); opacity: 0; }
        70%  { transform: scale(1.05); }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // Create widget DOM
  function createWidget() {
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
    icon.textContent = '🍍';
    icon.style.fontSize = '18px';

    const title = document.createElement('h1');
    title.textContent = 'Standup';
    title.style.cssText = 'font-size: 15px; font-weight: 600; letter-spacing: -0.01em; margin: 0;';

    titleDiv.appendChild(icon);
    titleDiv.appendChild(title);

    const githubLink = document.createElement('a');
    githubLink.href = 'https://github.com/deliveryhero/jira-random-picker';
    githubLink.target = '_blank';
    githubLink.rel = 'noopener noreferrer';
    githubLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
</svg>`;
    githubLink.title = 'View on GitHub';
    githubLink.style.cssText = 'text-decoration: none; display: inline-flex; align-items: center; cursor: pointer; padding: 4px; opacity: 0.7; color: #6b778c !important;';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'widget-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.cssText = 'background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px; color: #6b778c;';

    const rightControls = document.createElement('div');
    rightControls.style.cssText = 'display: flex; align-items: center; gap: 2px;';
    rightControls.appendChild(githubLink);
    rightControls.appendChild(closeBtn);

    header.appendChild(titleDiv);
    header.appendChild(rightControls);

    // Content area
    const content = document.createElement('div');
    content.id = 'widget-content';
    content.style.cssText = 'flex: 1; overflow-y: auto; padding: 14px; position: relative;';

    widget.appendChild(header);
    widget.appendChild(content);

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
  let allAssignees = []; // scraped assignees with avatars
  let phase = 'setup'; // setup, picking, not-on-board, any-discussion, complete
  let remainingPool = []; // array of { name, avatar } objects
  let pickedOrder = [];
  let currentlySelectedPerson = null; // track who's currently filtered on the board
  let dropdownSelectedNames = new Set(); // track which dropdown users we've selected
  let assigneeMap = {}; // name -> avatar lookup

  // Load and display widget content
  function loadWidgetContent() {
    const content = document.getElementById('widget-content');

    // Try to expand dropdown if it exists
    const showMoreBtn = document.querySelector('button[data-testid*="assignee-filter-show-more"]');
    if (showMoreBtn && showMoreBtn.getAttribute('aria-expanded') === 'false') {
      showMoreBtn.click();
      setTimeout(() => {
        renderSetupUI();
        // Collapse dropdown back after scraping
        const btn = document.querySelector('button[data-testid*="assignee-filter-show-more"]');
        if (btn && btn.getAttribute('aria-expanded') === 'true') {
          btn.click();
        }
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

      // Use only scraped assignees
      const assignees = allAssignees;

      // Build assignee map for avatar lookup
      assigneeMap = {};
      assignees.forEach(a => {
        assigneeMap[a.name] = a.avatar;
      });

      let html = `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0 8px 0;">
          <button id="btn-all-widget" type="button" style="background: none; border: none; color: #0052cc !important; font-size: 12px; cursor: pointer; padding: 0; font-weight: 500;">All</button>

          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 18px;">👥</span>
            <span style="background: linear-gradient(90deg, #0052cc, #6554c0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 14px; font-weight: 700;">Who's in today?</span>
          </div>

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
        <button id="btn-start-widget" type="button" style="width: 100%; padding: 10px; background: #6554c0 !important; color: white !important; border: none; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer;">Start</button>
      `;

      content.innerHTML = html;

      // Setup event listeners
      const btnAll = content.querySelector('#btn-all-widget');
      const btnNone = content.querySelector('#btn-none-widget');
      const btnStart = content.querySelector('#btn-start-widget');
      const checkboxes = content.querySelectorAll('.assignee-checkbox-widget');

      btnAll.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = true);
      });

      btnNone.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = false);
      });

      btnStart.addEventListener('click', () => {
        const checked = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (checked.length > 0) {
          phase = 'picking';
          remainingPool = checked.map(name => ({ name, avatar: assigneeMap[name] || '' }));
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

    function collapseDropdown() {
      const showMoreBtn = document.querySelector('button[data-testid*="assignee-filter-show-more"]');
      if (showMoreBtn && showMoreBtn.getAttribute('aria-expanded') === 'true') {
        showMoreBtn.click();
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

    function renderBackButton() {
      return `<button id="btn-back-widget" style="
        position: absolute; top: 10px; left: 10px;
        background: none; border: none; cursor: pointer;
        font-size: 13px; color: #6b7280; padding: 2px 6px;
        border-radius: 4px; line-height: 1; font-weight: 500;
      ">← Back</button>`;
    }

    async function clearCurrentFilter() {
      if (currentlySelectedPerson) {
        const type = await toggleFilter(currentlySelectedPerson, false);
        if (type === 'dropdown') collapseDropdown();
        currentlySelectedPerson = null;
      }
      dropdownSelectedNames.clear();
    }

    async function renderPickingUI() {
      if (remainingPool.length === 0) {
        // Deselect the last person before showing "not on board" screen
        if (currentlySelectedPerson) {
          const type = await toggleFilter(currentlySelectedPerson, false);
          if (type === 'dropdown') collapseDropdown();
          dropdownSelectedNames.delete(currentlySelectedPerson);
          currentlySelectedPerson = null;
        }
        phase = 'not-on-board';
        renderNotOnBoardUI();
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

      // Pick randomly
      const idx = Math.floor(Math.random() * remainingPool.length);
      const winner = remainingPool[idx];
      remainingPool.splice(idx, 1);
      pickedOrder.push(winner);

      // Auto-select this assignee in the filter
      selectAssigneeFilter(winner.name);

      displayPersonCard(winner);
    }

    function displayPersonCard(winner) {
      const total = pickedOrder.length + remainingPool.length;
      const pct = Math.round((pickedOrder.length / total) * 100);
      const avatarImg = winner.avatar ? `<img src="${winner.avatar}" alt="${winner.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 3px #0052cc, 0 0 0 6px rgba(0,82,204,0.25), 0 0 20px rgba(0,82,204,0.35); animation: pop-in 0.35s ease-out;">` : '';

      let html = `
        ${renderBackButton()}
        <div style="text-align: center; padding: 30px 20px;">
          ${avatarImg}
          <p style="background: linear-gradient(90deg, #0052cc, #6554c0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: clamp(15px, 5vw, 22px); font-weight: 700; word-break: break-word; line-height: 1.3; margin: 14px 0 0 0;">${winner.name}</p>
          <div style="background: #dfe1e6; border-radius: 4px; height: 6px; margin: 16px 0 4px 0;">
            <div style="width: ${pct}%; background: linear-gradient(90deg, #0052cc, #6554c0); height: 6px; border-radius: 4px; transition: width 0.4s ease;"></div>
          </div>
          <p style="font-size: 12px; color: #6b778c; margin: 0;">${pickedOrder.length} of ${total} done</p>
        </div>
        <button id="btn-next-widget" type="button" style="width: calc(100% - 28px); margin: 0 14px 14px 14px; padding: 10px; background: #6554c0 !important; color: white !important; border: none; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer;">
          ${remainingPool.length === 0 ? 'Others 🙋‍♂️' : `Next Person (${remainingPool.length} left)`}
        </button>
      `;

      content.innerHTML = html;

      const btnNext = content.querySelector('#btn-next-widget');
      btnNext.addEventListener('click', () => {
        renderPickingUI();
      });

      const btnBack = content.querySelector('#btn-back-widget');
      if (btnBack) {
        btnBack.addEventListener('click', async () => {
          const current = pickedOrder.pop();
          remainingPool.unshift(current);

          if (pickedOrder.length === 0) {
            // First pick — go back to setup
            await clearCurrentFilter();
            currentlySelectedPerson = null;
            phase = 'setup';
            renderSetupUI(false);
          } else {
            // Show previous person without re-picking
            const previous = pickedOrder[pickedOrder.length - 1];
            selectAssigneeFilter(previous.name); // fire-and-forget
            displayPersonCard(previous);
          }
        });
      }
    }

    function renderNotOnBoardUI() {
      const html = `
        ${renderBackButton()}
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 24px;">🙋</div>
          <p style="background: linear-gradient(90deg, #0052cc, #6554c0);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    background-clip: text; font-size: 20px; font-weight: 700;
                    margin: 0 0 8px 0;">Ohne Tickets?</p>
          <p style="font-size: 13px; color: #6b778c; margin: 0;">
            Tasks outside board
          </p>
        </div>
        <button id="btn-not-on-board-continue" type="button"
          style="width: calc(100% - 28px); margin: 0 14px 14px 14px; padding: 10px;
                 background: #6554c0 !important; color: white !important;
                 border: none; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer;">
          Continue →
        </button>
      `;
      content.innerHTML = html;
      content.querySelector('#btn-not-on-board-continue').addEventListener('click', () => {
        phase = 'any-discussion';
        renderDiscussionUI();
      });

      const btnBack = content.querySelector('#btn-back-widget');
      if (btnBack) {
        btnBack.addEventListener('click', () => {
          phase = 'picking';
          const previous = pickedOrder[pickedOrder.length - 1];
          selectAssigneeFilter(previous.name); // restore filter to last picked person
          displayPersonCard(previous);
        });
      }
    }

    function renderDiscussionUI() {
      const html = `
        ${renderBackButton()}
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 24px;">💬</div>
          <p style="background: linear-gradient(90deg, #0052cc, #6554c0);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    background-clip: text; font-size: 20px; font-weight: 700;
                    margin: 0 0 8px 0;">Any discussion?</p>
          <p style="font-size: 13px; color: #6b778c; margin: 0;">
            Blockers, shoutouts, or announcements
          </p>
        </div>
        <button id="btn-discussion-end" type="button"
          style="width: calc(100% - 28px); margin: 0 14px 14px 14px; padding: 10px;
                 background: #6554c0 !important; color: white !important;
                 border: none; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer;">
          End Standup 🎉
        </button>
      `;
      content.innerHTML = html;
      content.querySelector('#btn-discussion-end').addEventListener('click', () => {
        phase = 'complete';
        renderCompleteUI();
      });

      const btnBack = content.querySelector('#btn-back-widget');
      if (btnBack) {
        btnBack.addEventListener('click', () => {
          phase = 'not-on-board';
          renderNotOnBoardUI();
        });
      }
    }

    function renderCompleteUI() {
      let html = `
        <div style="text-align: center; padding: 30px 20px; display: flex; flex-direction: column; align-items: center; gap: 20px;">
          <div style="display: flex; justify-content: center; gap: 6px; font-size: 44px; margin-bottom: 8px;">
            <span class="confetti-piece" style="animation-delay: 0s;">🎉</span>
            <span class="confetti-piece" style="animation-delay: 0.15s;">🎊</span>
            <span class="confetti-piece" style="animation-delay: 0.3s;">✨</span>
            <span class="confetti-piece" style="animation-delay: 0.45s;">🎉</span>
            <span class="confetti-piece" style="animation-delay: 0.6s;">🎊</span>
          </div>
          <div>
            <p style="background: linear-gradient(90deg, #0052cc, #6554c0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 22px; font-weight: 700; margin: 0;">Standup Complete!</p>
            <p style="font-size: 13px; color: #6b778c; margin: 8px 0 0 0;">Have a great day ahead!! 🚀</p>
          </div>
        </div>
        <button id="btn-restart-widget" type="button" style="width: calc(100% - 28px); margin: 0 14px 14px 14px; padding: 10px; background: #6554c0 !important; color: white !important; border: none; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer;">Start Over</button>
      `;

      content.innerHTML = html;

      const btnRestart = content.querySelector('#btn-restart-widget');
      btnRestart.addEventListener('click', () => {
        phase = 'setup';
        remainingPool = [];
        pickedOrder = [];
        currentlySelectedPerson = null; // Reset tracked selection
        dropdownSelectedNames.clear(); // Clear dropdown tracking on restart
        renderSetupUI(false); // Re-render but don't rescrape
      });
    }
  }

  // Show widget
  function showWidget() {
    // Check if already exists
    if (document.getElementById(WIDGET_ID)) {
      return;
    }

    // Create and inject widget
    const widget = createWidget();

    if (!document.body) {
      setTimeout(showWidget, 200);
      return;
    }

    document.body.appendChild(widget);

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

})();
