import { describe, it, expect, beforeEach } from 'vitest';
import { createWidget } from '../../widget.js';

describe('createWidget', () => {
  beforeEach(() => {
    // Clean up style tags and widgets before each test
    const styleTag = document.getElementById('standup-widget-styles');
    if (styleTag) {
      styleTag.remove();
    }
    const widget = document.getElementById('jira-standup-widget');
    if (widget) {
      widget.remove();
    }
  });

  it('returns a div element with correct id', () => {
    const widget = createWidget();

    expect(widget).toBeTruthy();
    expect(widget.tagName).toBe('DIV');
    expect(widget.id).toBe('jira-standup-widget');
  });

  it('has position: fixed and z-index: 999999 in inline styles', () => {
    const widget = createWidget();

    const style = widget.getAttribute('style');
    expect(style).toContain('position: fixed');
    expect(style).toContain('z-index: 999999');
  });

  it('contains widget-content div', () => {
    const widget = createWidget();
    const content = widget.querySelector('#widget-content');

    expect(content).toBeTruthy();
    expect(content.tagName).toBe('DIV');
  });

  it('contains close button', () => {
    const widget = createWidget();
    const closeBtn = widget.querySelector('#widget-close');

    expect(closeBtn).toBeTruthy();
    expect(closeBtn.tagName).toBe('BUTTON');
    expect(closeBtn.getAttribute('aria-label')).toBe('Close');
  });

  it('contains GitHub link with correct attributes', () => {
    const widget = createWidget();
    const githubLink = widget.querySelector('a');

    expect(githubLink).toBeTruthy();
    expect(githubLink.href).toContain('github.com/saavan251/jira-standup-widget');
    expect(githubLink.target).toBe('_blank');
    expect(githubLink.rel).toBe('noopener noreferrer');
  });

  it('contains header with title and icon', () => {
    const widget = createWidget();
    const header = widget.querySelector('.widget-header');

    expect(header).toBeTruthy();

    const title = header.querySelector('h1');
    expect(title).toBeTruthy();
    expect(title.textContent).toBe('Standup');

    const icon = header.querySelector('span');
    expect(icon.textContent).toContain('🍍');
  });

  it('injects styles when called', () => {
    createWidget();

    const styleTag = document.getElementById('standup-widget-styles');
    expect(styleTag).toBeTruthy();
  });
});
