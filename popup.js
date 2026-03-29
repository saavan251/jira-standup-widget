// popup.js
// Orchestrates tab validation, message passing, checklist, and animation.

document.addEventListener('DOMContentLoaded', () => {
  const BOARD_PATTERN =
    /^https:\/\/[^/]+\.atlassian\.net\/jira\/software\/.+\/projects\/.+\/board/;
  const STORAGE_KEY = 'jira-standup-state';

  // ── DOM references ──
  const stateLoading = document.getElementById('state-loading');
  const stateError   = document.getElementById('state-error');
  const stateMain    = document.getElementById('state-main');
  const stateComplete = document.getElementById('state-complete');
  const errorMsg     = document.getElementById('error-message');
  const assigneeList = document.getElementById('assignee-list');
  const btnPick      = document.getElementById('btn-pick');
  const btnAll       = document.getElementById('btn-all');
  const btnNone      = document.getElementById('btn-none');
  const btnRestart   = document.getElementById('btn-restart');
  const resultArea   = document.getElementById('result-area');
  const resultName   = document.getElementById('result-name');
  const pickedOrderList = document.getElementById('picked-order-list');
  const remainingCount = document.getElementById('remaining-count');
  const checklistControls = document.querySelector('.checklist-controls');
  const customNameInput = document.getElementById('custom-name-input');
  const btnAddCustom = document.getElementById('btn-add-custom');

  // ── Standup state machine ──
  // phase: 'setup' | 'picking' | 'complete'
  let phase = 'setup';
  let remainingPool = [];   // names not yet picked
  let pickedOrder   = [];   // names in order picked
  let customNames = [];     // names added by user (no avatars)
  let currentAssignees = []; // cached assignees with avatars

  // ── Save state to storage ──
  function persistState() {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        [STORAGE_KEY]: {
          phase,
          remainingPool,
          pickedOrder,
          customNames,
          currentAssignees
        }
      });
    }
  }

  // ── Initialize fresh board scrape ──
  function initializeBoard() {
    showLoading();
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) {
        showError('No active tab found.');
        return;
      }
      if (!BOARD_PATTERN.test(tab.url || '')) {
        showError(
          'Navigate to a Jira sprint board first.\n' +
          '(URL must match …/jira/software/projects/…/boards/…)'
        );
        return;
      }
      scrapeTab(tab.id);
    });
  }

  // ── Load persisted state ──
  function loadPersistedState() {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      // Storage not available, skip and init board fresh
      initializeBoard();
      return;
    }

    chrome.storage.local.get(STORAGE_KEY, (data) => {
      try {
        const saved = data[STORAGE_KEY];
        if (saved && saved.currentAssignees && saved.currentAssignees.length > 0) {
          phase = saved.phase || 'setup';
          remainingPool = saved.remainingPool || [];
          pickedOrder = saved.pickedOrder || [];
          customNames = saved.customNames || [];
          currentAssignees = saved.currentAssignees || [];

          const allAssignees = currentAssignees.concat(
            customNames.map(n => ({ name: n, avatar: '' }))
          );

          if (phase === 'setup') {
            renderChecklist(allAssignees);
            syncPickButton();
            showMain();
          } else if (phase === 'picking') {
            renderChecklist(allAssignees);
            checklistControls.hidden = true;
            assigneeList.classList.add('picking-mode');
            // Re-apply picked styling
            assigneeList.querySelectorAll('.assignee-checkbox').forEach(cb => {
              if (pickedOrder.includes(cb.value)) {
                cb.disabled = true;
                cb.closest('.assignee-item').classList.add('picked');
              } else {
                cb.disabled = true;
              }
            });
            updateRemainingCount();
            showMain();
          } else if (phase === 'complete') {
            showComplete();
          }
        } else {
          // No saved state, proceed with normal init
          initializeBoard();
        }
      } catch (err) {
        console.error('Error loading persisted state:', err);
        initializeBoard();
      }
    });
  }

  // ── State transitions ──
  function showLoading() {
    stateLoading.hidden  = false;
    stateError.hidden    = true;
    stateMain.hidden     = true;
    stateComplete.hidden = true;
  }
  function showError(msg) {
    errorMsg.textContent = msg;
    stateLoading.hidden  = true;
    stateError.hidden    = false;
    stateMain.hidden     = true;
    stateComplete.hidden = true;
  }
  function showMain() {
    stateLoading.hidden  = true;
    stateError.hidden    = true;
    stateMain.hidden     = false;
    stateComplete.hidden = true;
  }
  function showComplete() {
    stateLoading.hidden  = true;
    stateError.hidden    = true;
    stateMain.hidden     = true;
    stateComplete.hidden = false;
    pickedOrderList.innerHTML = '';
    pickedOrder.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      pickedOrderList.appendChild(li);
    });
  }

  // ── Checklist rendering ──
  function renderChecklist(assigneeData) {
    assigneeList.innerHTML = '';

    // assigneeData is now an array of { name, avatar } objects
    assigneeData.forEach(item => {
      const name = typeof item === 'string' ? item : item.name;
      const avatar = item.avatar || '';

      const li = document.createElement('li');
      li.className = 'assignee-item';

      const label = document.createElement('label');
      label.className = 'assignee-label';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'assignee-checkbox';
      cb.value = name;
      cb.checked = true;
      cb.addEventListener('change', syncPickButton);

      label.appendChild(cb);

      // Add avatar if available
      if (avatar) {
        const img = document.createElement('img');
        img.className = 'assignee-avatar';
        img.src = avatar;
        img.alt = name;
        label.appendChild(img);
      }

      const span = document.createElement('span');
      span.className = 'assignee-name';
      span.textContent = name;

      label.appendChild(span);
      li.appendChild(label);
      assigneeList.appendChild(li);
    });

    syncPickButton();
    showMain();
  }

  function syncPickButton() {
    btnPick.disabled = getCheckedNames().length === 0;
  }

  function getCheckedNames() {
    return [...assigneeList.querySelectorAll('.assignee-checkbox:checked')]
      .map(cb => cb.value);
  }

  function getCheckedItems() {
    return [...assigneeList.querySelectorAll('.assignee-item')]
      .filter(li => li.querySelector('.assignee-checkbox')?.checked);
  }

  function getActiveItems() {
    return [...assigneeList.querySelectorAll('.assignee-item')]
      .filter(li => !li.classList.contains('picked'));
  }

  function updateRemainingCount() {
    if (phase === 'picking') {
      const total = pickedOrder.length + remainingPool.length;
      remainingCount.textContent = `${remainingPool.length} of ${total} remaining`;
      remainingCount.hidden = false;
    } else {
      remainingCount.hidden = true;
    }
  }

  function startStandup(names) {
    phase = 'picking';
    remainingPool = [...names];
    pickedOrder = [];

    // Freeze checklist UI
    checklistControls.hidden = true;
    assigneeList.querySelectorAll('.assignee-checkbox')
      .forEach(cb => { cb.disabled = true; });
    assigneeList.classList.add('picking-mode');

    updateRemainingCount();
    persistState();
    pickNext();
  }

  function pickNext() {
    if (remainingPool.length === 0) {
      phase = 'complete';
      persistState();
      showComplete();
      return;
    }

    // Clear previous highlights
    assigneeList.querySelectorAll('.assignee-item')
      .forEach(li => li.classList.remove('winner', 'flashing'));
    resultArea.hidden = true;

    const idx    = Math.floor(Math.random() * remainingPool.length);
    const winner = remainingPool[idx];
    animatePick(getActiveItems(), winner);
  }

  // ── All / None controls ──
  btnAll.addEventListener('click', () => {
    assigneeList.querySelectorAll('.assignee-checkbox')
      .forEach(cb => { cb.checked = true; });
    syncPickButton();
  });
  btnNone.addEventListener('click', () => {
    assigneeList.querySelectorAll('.assignee-checkbox')
      .forEach(cb => { cb.checked = false; });
    syncPickButton();
  });

  // ── Custom name input ──
  if (btnAddCustom && customNameInput) {
    btnAddCustom.addEventListener('click', () => {
      const name = customNameInput.value.trim();
      if (name && name.length >= 1) {
        customNames.push(name);
        customNameInput.value = '';

        // Re-render with custom names added
        const allAssignees = currentAssignees.concat(
          customNames.map(n => ({ name: n, avatar: '' }))
        );
        renderChecklist(allAssignees);
        persistState();
      }
    });

    customNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        btnAddCustom.click();
      }
    });
  }

  // ── State machine button handler ──
  btnPick.addEventListener('click', () => {
    if (phase === 'setup') {
      const names = getCheckedNames();
      if (names.length === 0) return;
      startStandup(names);
    } else if (phase === 'picking') {
      pickNext();
    }
  });

  // ── Reset to setup ──
  function resetToSetup() {
    phase = 'setup';
    remainingPool = [];
    pickedOrder   = [];
    customNames = [];

    checklistControls.hidden = false;
    assigneeList.querySelectorAll('.assignee-checkbox')
      .forEach(cb => { cb.disabled = false; cb.checked = true; });
    assigneeList.querySelectorAll('.assignee-item')
      .forEach(li => li.classList.remove('winner', 'picked', 'flashing'));
    assigneeList.classList.remove('picking-mode');

    customNameInput.value = '';
    resultArea.hidden = true;
    remainingCount.hidden = true;

    btnPick.textContent = 'Start Standup';
    btnPick.classList.remove('btn-next');

    // Re-render without custom names
    renderChecklist(currentAssignees);
    syncPickButton();
    persistState();

    showMain();
  }

  btnRestart.addEventListener('click', resetToSetup);

  // ── Slot-machine animation ──
  // Cycles through checked items with easing from fast → slow, then lands on winner.
  function animatePick(items, winnerName) {
    btnPick.disabled = true;
    btnPick.textContent = 'Picking...';

    const TOTAL_MS       = 1400; // total animation duration
    const START_INTERVAL = 80;   // ms between flashes at start (fast)
    const END_INTERVAL   = 280;  // ms between flashes at end (slow)

    let currentIdx = 0;
    let elapsed    = 0;

    function intervalAt(t) {
      // Linear ease from START_INTERVAL to END_INTERVAL
      return Math.round(START_INTERVAL + (END_INTERVAL - START_INTERVAL) * Math.min(t, 1));
    }

    function step() {
      items.forEach(el => el.classList.remove('flashing'));

      if (elapsed >= TOTAL_MS) {
        landOnWinner(winnerName, items);
        return;
      }

      items[currentIdx % items.length].classList.add('flashing');
      currentIdx++;

      const delay = intervalAt(elapsed / TOTAL_MS);
      elapsed += delay;
      setTimeout(step, delay);
    }

    step();
  }

  function landOnWinner(winnerName, items) {
    const winnerItem = items.find(
      el => el.querySelector('.assignee-name')?.textContent.trim() === winnerName
    );
    if (winnerItem) {
      winnerItem.classList.add('winner');
      winnerItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    resultName.textContent = winnerName;
    resultName.style.animation = 'none';
    void resultName.offsetHeight;
    resultName.style.animation = '';
    resultArea.hidden = false;

    // Remove from pool using index (handles duplicate names safely)
    const idxToRemove = remainingPool.indexOf(winnerName);
    if (idxToRemove !== -1) remainingPool.splice(idxToRemove, 1);
    pickedOrder.push(winnerName);
    persistState();

    // Dim picked item after winner highlight is visible
    setTimeout(() => {
      if (winnerItem) winnerItem.classList.add('picked');
    }, 800);

    updateRemainingCount();

    if (remainingPool.length === 0) {
      btnPick.textContent = 'Finish Standup 🎉';
      btnPick.classList.remove('btn-next');
    } else {
      btnPick.textContent = `Next Person (${remainingPool.length} left)`;
      btnPick.classList.add('btn-next');
    }
    btnPick.disabled = false;
  }

  // ── Message passing ──
  function handleResponse(response) {
    if (!response) {
      showError('No response from the page. Try reloading the Jira tab.');
      return;
    }
    if (response.error) {
      showError('Scraping error: ' + response.error);
      return;
    }
    if (!response.assignees || response.assignees.length === 0) {
      showError('No assignees found on this board.\nMake sure sprint cards are assigned to people.');
      return;
    }
    // Store scraped assignees for later merging with custom names
    currentAssignees = response.assignees;

    // Render with custom names appended
    const allAssignees = currentAssignees.concat(
      customNames.map(n => ({ name: n, avatar: '' }))
    );
    renderChecklist(allAssignees);
    persistState();
  }

  function scrapeTab(tabId) {
    chrome.tabs.sendMessage(tabId, { action: 'SCRAPE_ASSIGNEES' }, response => {
      if (chrome.runtime.lastError) {
        // Content script not present — tab was open before extension loaded.
        // Inject programmatically, then retry.
        chrome.scripting.executeScript(
          { target: { tabId }, files: ['content.js'] },
          () => {
            if (chrome.runtime.lastError) {
              showError('Could not inject script into this tab.\nCheck host_permissions.');
              return;
            }
            chrome.tabs.sendMessage(tabId, { action: 'SCRAPE_ASSIGNEES' }, resp => {
              if (chrome.runtime.lastError) {
                showError('Script injected but did not respond. Reload the Jira tab and try again.');
                return;
              }
              handleResponse(resp);
            });
          }
        );
        return;
      }
      handleResponse(response);
    });
  }

  // Load saved state, or init fresh if none exists
  loadPersistedState();
});
