import { describe, it, expect } from 'vitest';
import { isValidAssignee } from '../../widget.js';

describe('isValidAssignee', () => {
  describe('rejection cases', () => {
    const rejectList = [
      'unassigned',
      'UNASSIGNED',
      'unassign',
      'none',
      'no assignee',
      'unknown',
      'bot',
      'automation',
      ''
    ];

    rejectList.forEach(name => {
      it(`rejects "${name}"`, () => {
        expect(isValidAssignee(name)).toBe(false);
      });
    });
  });

  describe('acceptance cases', () => {
    const acceptList = [
      'Jane Smith',
      'Alice',
      'Bob',
      'João',
      'Miguel García',
      'Maria Silva',
      'Developer'
    ];

    acceptList.forEach(name => {
      it(`accepts "${name}"`, () => {
        expect(isValidAssignee(name)).toBe(true);
      });
    });
  });

  it('is case-insensitive for rejections', () => {
    expect(isValidAssignee('UnAssigned')).toBe(false);
    expect(isValidAssignee('NONE')).toBe(false);
  });
});
