import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadWidget } from '../setup.js';

describe('State Machine Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    // Seed document with minimal mock Jira DOM with 3 assignees
    document.body.innerHTML = `
      <div>
        <!-- Strategy 1: input assignee filters -->
        <input name="assignee" aria-label="Filter assignees by Alice" />
        <img alt="" src="https://example.com/alice.jpg" />

        <input name="assignee" aria-label="Filter assignees by Bob" />
        <img alt="" src="https://example.com/bob.jpg" />

        <input name="assignee" aria-label="Filter assignees by Charlie" />
        <img alt="" src="https://example.com/charlie.jpg" />

        <!-- Dropdown toggle button (hidden initially) -->
        <button data-testid="assignee-filter-show-more" aria-expanded="false">Show More</button>
      </div>
    `;

    // Load the widget IIFE, which registers chrome.runtime.onMessage listener
    loadWidget();
  });

  it('starts in setup phase with assignees listed', async () => {
    // Trigger widget toggle
    const listeners = global.chrome.runtime.onMessage.addListener.mock.calls;
    expect(listeners.length).toBeGreaterThan(0);

    const messageHandler = listeners[0][0];

    // Simulate chrome message to show widget
    messageHandler(
      { action: 'TOGGLE_WIDGET' },
      {},
      vi.fn()
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    const widget = document.getElementById('jira-standup-widget');
    expect(widget).toBeTruthy();

    const assigneeList = widget.querySelector('#assignee-list-widget');
    expect(assigneeList).toBeTruthy();

    const checkboxes = assigneeList.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(3);
    checkboxes.forEach(cb => expect(cb.checked).toBe(true));
  });

  it('transitions to picking phase when Start is clicked with selected assignees', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, vi.fn());
    await new Promise(resolve => setTimeout(resolve, 1000));

    const widget = document.getElementById('jira-standup-widget');
    const startBtn = widget.querySelector('#btn-start-widget');
    expect(startBtn).toBeTruthy();

    startBtn.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify person card is shown (picking phase)
    const personCard = widget.querySelector('[style*="text-align: center"]');
    expect(personCard).toBeTruthy();

    const nextBtn = widget.querySelector('#btn-next-widget');
    expect(nextBtn).toBeTruthy();
  });

  it('blocks transition to picking if no assignees selected', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, vi.fn());
    await new Promise(resolve => setTimeout(resolve, 1000));

    const widget = document.getElementById('jira-standup-widget');
    const checkboxes = widget.querySelectorAll('.assignee-checkbox-widget');
    checkboxes.forEach(cb => cb.checked = false);

    const startBtn = widget.querySelector('#btn-start-widget');
    startBtn.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify still in setup (assignee list still visible)
    const assigneeList = widget.querySelector('#assignee-list-widget');
    expect(assigneeList).toBeTruthy();
  });

  it('cycles through all people on Next Person clicks', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, vi.fn());
    await new Promise(resolve => setTimeout(resolve, 1000));

    const widget = document.getElementById('jira-standup-widget');
    const startBtn = widget.querySelector('#btn-start-widget');
    startBtn.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    const pickedNames = [];

    // First person
    let personName = widget.querySelector('p[style*="background: linear-gradient"]');
    expect(personName).toBeTruthy();
    pickedNames.push(personName.textContent);

    // Click Next 3 times (should show all 3 people then transition to not-on-board)
    for (let i = 0; i < 3; i++) {
      const nextBtn = widget.querySelector('#btn-next-widget');
      expect(nextBtn).toBeTruthy();
      nextBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      personName = widget.querySelector('p[style*="background: linear-gradient"]');
      if (personName && !personName.textContent.includes('Members not on Jira board')) {
        pickedNames.push(personName.textContent);
      }
    }

    // After 3rd click on empty pool, should reach "Members not on Jira board" screen
    const noTicketsScreen = widget.textContent.includes('Members not on Jira board');
    expect(noTicketsScreen).toBe(true);
  });

  it('navigates through all phases: Setup → Picking → Not-on-board → Discussion → Complete', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, vi.fn());
    await new Promise(resolve => setTimeout(resolve, 1000));

    let widget = document.getElementById('jira-standup-widget');

    // Setup phase
    expect(widget.querySelector('#btn-start-widget')).toBeTruthy();

    // Start
    widget.querySelector('#btn-start-widget').click();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Picking phase - cycle through all
    for (let i = 0; i < 3; i++) {
      const nextBtn = widget.querySelector('#btn-next-widget');
      nextBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Not-on-board phase
    expect(widget.textContent).toContain('Members not on Jira board');
    const continueBtn = widget.querySelector('#btn-not-on-board-continue');
    expect(continueBtn).toBeTruthy();

    continueBtn.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Discussion phase
    expect(widget.textContent).toContain('Discussions?');
    const endBtn = widget.querySelector('#btn-discussion-end');
    expect(endBtn).toBeTruthy();

    endBtn.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Complete phase
    expect(widget.textContent).toContain('Standup Complete');
    const restartBtn = widget.querySelector('#btn-restart-widget');
    expect(restartBtn).toBeTruthy();
  });

  it('Back button from first pick returns to setup', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, vi.fn());
    await new Promise(resolve => setTimeout(resolve, 1000));

    let widget = document.getElementById('jira-standup-widget');

    widget.querySelector('#btn-start-widget').click();
    await new Promise(resolve => setTimeout(resolve, 50));

    // First person shown
    expect(widget.querySelector('#btn-next-widget')).toBeTruthy();

    const backBtn = widget.querySelector('#btn-back-widget');
    expect(backBtn).toBeTruthy();

    backBtn.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Back to setup
    expect(widget.querySelector('#btn-start-widget')).toBeTruthy();
    expect(widget.querySelector('#assignee-list-widget')).toBeTruthy();
  });

  it('Back button from second pick shows previous person', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, vi.fn());
    await new Promise(resolve => setTimeout(resolve, 1000));

    let widget = document.getElementById('jira-standup-widget');

    widget.querySelector('#btn-start-widget').click();
    await new Promise(resolve => setTimeout(resolve, 50));

    const firstPersonName = widget.querySelector('p[style*="background: linear-gradient"]').textContent;

    widget.querySelector('#btn-next-widget').click();
    await new Promise(resolve => setTimeout(resolve, 50));

    const secondPersonName = widget.querySelector('p[style*="background: linear-gradient"]').textContent;
    expect(secondPersonName).not.toBe(firstPersonName);

    const backBtn = widget.querySelector('#btn-back-widget');
    backBtn.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Should show first person again
    const restoredPersonName = widget.querySelector('p[style*="background: linear-gradient"]').textContent;
    expect(restoredPersonName).toBe(firstPersonName);
  });

  it('Start Over from complete resets state fully', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, vi.fn());
    await new Promise(resolve => setTimeout(resolve, 1000));

    let widget = document.getElementById('jira-standup-widget');

    // Run through to complete
    widget.querySelector('#btn-start-widget').click();
    await new Promise(resolve => setTimeout(resolve, 50));

    for (let i = 0; i < 3; i++) {
      widget.querySelector('#btn-next-widget').click();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    widget.querySelector('#btn-not-on-board-continue').click();
    await new Promise(resolve => setTimeout(resolve, 50));

    widget.querySelector('#btn-discussion-end').click();
    await new Promise(resolve => setTimeout(resolve, 50));

    const restartBtn = widget.querySelector('#btn-restart-widget');
    restartBtn.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Back to setup with all checkboxes checked
    expect(widget.querySelector('#btn-start-widget')).toBeTruthy();
    const checkboxes = widget.querySelectorAll('.assignee-checkbox-widget');
    checkboxes.forEach(cb => expect(cb.checked).toBe(true));
  });
});
