import { describe, it, expect, beforeEach } from 'vitest';
import { addStyles } from '../../widget.js';

describe('addStyles', () => {
  beforeEach(() => {
    // Clean up before each test
    const existingStyle = document.getElementById('standup-widget-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
  });

  it('injects style tag into document head', () => {
    const initialStyleCount = document.head.querySelectorAll('style').length;

    addStyles();

    const styleTag = document.getElementById('standup-widget-styles');
    expect(styleTag).toBeTruthy();
    expect(styleTag.tagName).toBe('STYLE');
    expect(document.head.querySelectorAll('style').length).toBe(initialStyleCount + 1);
  });

  it('contains expected CSS rules', () => {
    addStyles();

    const styleTag = document.getElementById('standup-widget-styles');
    const content = styleTag.textContent;

    expect(content).toContain('#jira-standup-widget');
    expect(content).toContain('color: inherit');
    expect(content).toContain('accent-color: #0052cc');
    expect(content).toContain('@keyframes confetti-bounce');
    expect(content).toContain('@keyframes pop-in');
  });

  it('is idempotent: second call does not add duplicate style tags', () => {
    addStyles();
    const initialCount = document.head.querySelectorAll('#standup-widget-styles').length;

    addStyles();

    const finalCount = document.head.querySelectorAll('#standup-widget-styles').length;
    expect(finalCount).toBe(initialCount);
    expect(finalCount).toBe(1);
  });
});
