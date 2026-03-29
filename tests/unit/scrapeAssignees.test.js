import { describe, it, expect, beforeEach } from 'vitest';
import { scrapeAssignees } from '../../widget.js';

describe('scrapeAssignees', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns empty array when no assignees found', () => {
    const result = scrapeAssignees();
    expect(result).toEqual([]);
  });

  describe('Strategy 1: input[name="assignee"][aria-label]', () => {
    it('extracts assignee names from input labels', () => {
      document.body.innerHTML = `
        <div>
          <input name="assignee" aria-label="Filter assignees by Jane Smith" />
          <input name="assignee" aria-label="Filter assignees by Bob Johnson" />
        </div>
      `;

      const result = scrapeAssignees();
      expect(result).toHaveLength(2);
      expect(result.map(a => a.name)).toEqual(['Bob Johnson', 'Jane Smith']); // sorted
    });

    it('filters out invalid names like "unassigned"', () => {
      document.body.innerHTML = `
        <div>
          <input name="assignee" aria-label="Filter assignees by Jane Smith" />
          <input name="assignee" aria-label="Filter assignees by unassigned" />
        </div>
      `;

      const result = scrapeAssignees();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Jane Smith');
    });

    it('extracts avatar URL from nearby img tag', () => {
      document.body.innerHTML = `
        <div>
          <input name="assignee" aria-label="Filter assignees by Jane Smith" />
          <img alt="" src="https://example.com/avatar.jpg" />
        </div>
      `;

      const result = scrapeAssignees();
      expect(result[0].avatar).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('Strategy 2: span[data-testid*="ak-avatar--label"]', () => {
    it('extracts single-character or two-character abbreviations', () => {
      document.body.innerHTML = `
        <span data-testid="ak-avatar--label">JS</span>
        <span data-testid="ak-avatar--label">BJ</span>
      `;

      const result = scrapeAssignees();
      expect(result).toHaveLength(2);
      expect(result.map(a => a.name)).toEqual(['BJ', 'JS']); // sorted
    });

    it('filters out non-letter characters', () => {
      document.body.innerHTML = `
        <span data-testid="ak-avatar--label">J5</span>
      `;

      const result = scrapeAssignees();
      expect(result).toHaveLength(1); // accepts as long as it contains a letter
    });

    it('does not add duplicates if already in Strategy 1', () => {
      document.body.innerHTML = `
        <div>
          <input name="assignee" aria-label="Filter assignees by Jane Smith" />
          <span data-testid="ak-avatar--label">Jane Smith</span>
        </div>
      `;

      const result = scrapeAssignees();
      expect(result).toHaveLength(1);
    });
  });

  describe('Strategy 3: [data-item-title="true"]', () => {
    it('extracts names from dropdown items (multiline text)', () => {
      document.body.innerHTML = `
        <div data-item-title="true">
          Jane Smith
          Senior Developer
        </div>
      `;

      const result = scrapeAssignees();
      expect(result).toHaveLength(2);
      expect(result.map(a => a.name).sort()).toEqual(['Jane Smith', 'Senior Developer']);
    });

    it('extracts avatar from nearby img tag', () => {
      document.body.innerHTML = `
        <div data-item-title="true">
          <img alt="" src="https://example.com/dropdown-avatar.jpg" />
          Jane Smith
        </div>
      `;

      const result = scrapeAssignees();
      expect(result[0].avatar).toBe('https://example.com/dropdown-avatar.jpg');
    });

    it('filters lines by length (2-50 chars) and contains letters', () => {
      document.body.innerHTML = `
        <div data-item-title="true">
          Jane Smith
          a
          some-very-long-text-that-exceeds-fifty-characters-so-it-should-be-filtered
        </div>
      `;

      const result = scrapeAssignees();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Jane Smith');
    });

    it('filters out invalid names', () => {
      document.body.innerHTML = `
        <div data-item-title="true">
          Jane Smith
          unassigned
        </div>
      `;

      const result = scrapeAssignees();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Jane Smith');
    });
  });

  describe('cross-strategy deduplication', () => {
    it('deduplicates names from multiple strategies (Strategy 1 avatar wins)', () => {
      document.body.innerHTML = `
        <div>
          <input name="assignee" aria-label="Filter assignees by Jane Smith" />
          <img alt="" src="https://example.com/strategy1-avatar.jpg" />
        </div>
        <span data-testid="ak-avatar--label">Jane Smith</span>
        <div data-item-title="true">
          <img alt="" src="https://example.com/strategy3-avatar.jpg" />
          Jane Smith
        </div>
      `;

      const result = scrapeAssignees();
      expect(result).toHaveLength(1);
      expect(result[0].avatar).toBe('https://example.com/strategy1-avatar.jpg');
    });
  });

  it('returns results sorted alphabetically by name', () => {
    document.body.innerHTML = `
      <div>
        <input name="assignee" aria-label="Filter assignees by Zoe" />
        <input name="assignee" aria-label="Filter assignees by Alice" />
        <input name="assignee" aria-label="Filter assignees by Bob" />
      </div>
    `;

    const result = scrapeAssignees();
    expect(result.map(a => a.name)).toEqual(['Alice', 'Bob', 'Zoe']);
  });
});
