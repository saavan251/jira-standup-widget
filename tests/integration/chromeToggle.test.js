import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadWidget } from '../setup.js';

describe('Chrome Toggle Message Handler', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    // Reset Chrome mock
    global.chrome.runtime.onMessage.addListener.mockClear();
    global.chrome.runtime.sendMessage.mockClear();

    // Seed minimal Jira DOM with one assignee
    document.body.innerHTML = `
      <div>
        <input name="assignee" aria-label="Filter assignees by Alice" />
        <button data-testid="assignee-filter-show-more" aria-expanded="false">Show More</button>
      </div>
    `;

    // Load the widget IIFE
    loadWidget();
  });

  it('registers a message listener on chrome.runtime.onMessage', () => {
    const calls = global.chrome.runtime.onMessage.addListener.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(typeof calls[0][0]).toBe('function');
  });

  it('creates and injects widget when TOGGLE_WIDGET arrives and widget does not exist', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
    const sendResponse = vi.fn();

    expect(document.getElementById('jira-standup-widget')).toBeFalsy();

    messageHandler(
      { action: 'TOGGLE_WIDGET' },
      {},
      sendResponse
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    const widget = document.getElementById('jira-standup-widget');
    expect(widget).toBeTruthy();
    expect(widget.tagName).toBe('DIV');
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('removes widget when TOGGLE_WIDGET arrives and widget exists', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
    const sendResponse1 = vi.fn();

    // First toggle: create widget
    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, sendResponse1);
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(document.getElementById('jira-standup-widget')).toBeTruthy();

    // Second toggle: remove widget
    const sendResponse2 = vi.fn();
    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, sendResponse2);

    expect(document.getElementById('jira-standup-widget')).toBeFalsy();
    expect(sendResponse2).toHaveBeenCalledWith({ success: true });
  });

  it('always calls sendResponse with success: true', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
    const sendResponse = vi.fn();

    messageHandler(
      { action: 'TOGGLE_WIDGET' },
      {},
      sendResponse
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('ignores unknown actions without creating or removing widget', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
    const sendResponse = vi.fn();

    expect(document.getElementById('jira-standup-widget')).toBeFalsy();

    messageHandler(
      { action: 'UNKNOWN_ACTION' },
      {},
      sendResponse
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(document.getElementById('jira-standup-widget')).toBeFalsy();
    expect(sendResponse).not.toHaveBeenCalled();
  });

  it('widget toggling is independent across multiple toggles', async () => {
    const messageHandler = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];

    // Toggle 1: create
    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, vi.fn());
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(document.getElementById('jira-standup-widget')).toBeTruthy();

    // Toggle 2: remove
    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, vi.fn());
    expect(document.getElementById('jira-standup-widget')).toBeFalsy();

    // Toggle 3: create again
    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, vi.fn());
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(document.getElementById('jira-standup-widget')).toBeTruthy();

    // Toggle 4: remove again
    messageHandler({ action: 'TOGGLE_WIDGET' }, {}, vi.fn());
    expect(document.getElementById('jira-standup-widget')).toBeFalsy();
  });
});
