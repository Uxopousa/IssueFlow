import { describe, expect, it } from 'vitest';

import { IssueInput } from './issue.model';
import { isIssueCollection, normalizeIssueInput, validateIssueInput } from './issue-validation';

function input(): IssueInput {
  return {
    title: 'Valid title',
    description: 'Valid description',
    category: 'General',
    priority: 'medium',
    status: 'open',
  };
}

describe('issue input validation', () => {
  it.each([undefined, null, [], 'text', 1])(
    'rejects non-object input %j with errors for each field',
    (value) => {
      expect(validateIssueInput(value)).toEqual({
        title: 'invalid',
        description: 'invalid',
        category: 'invalid',
        priority: 'invalid',
        status: 'invalid',
      });
    },
  );

  it.each<keyof IssueInput>(['title', 'description', 'category', 'priority', 'status'])(
    'requires own %s even when the prototype provides it',
    (field) => {
      const value = input();
      Object.setPrototypeOf(value, { [field]: value[field] });
      Reflect.deleteProperty(value, field);
      expect(validateIssueInput(value)).toEqual({ [field]: 'invalid' });
    },
  );

  it.each<['title' | 'description' | 'category', number, number]>([
    ['title', 3, 100],
    ['description', 10, 1000],
    ['category', 2, 50],
  ])('enforces trimmed %s boundaries and preserves the original', (field, min, max) => {
    for (const length of [min, max]) {
      const value = { ...input(), [field]: `  ${'x'.repeat(length)}  ` };
      expect(validateIssueInput(value)).toEqual({});
      expect(value[field]).toBe(`  ${'x'.repeat(length)}  `);
    }
    for (const text of [' ', 'x'.repeat(min - 1), 'x'.repeat(max + 1)]) {
      expect(validateIssueInput({ ...input(), [field]: text })).toEqual({ [field]: 'invalid' });
    }
  });

  it('reports all invalid fields independently', () => {
    expect(
      validateIssueInput({ ...input(), title: '', priority: 'urgent', status: 'closed' }),
    ).toEqual({ title: 'invalid', priority: 'invalid', status: 'invalid' });
  });

  it('normalizes editable text without mutating or copying protected and extra fields', () => {
    const value = {
      ...input(),
      title: ' Valid title ',
      description: ' Valid description ',
      category: ' General ',
      id: 'injected',
      createdAt: 'injected',
      other: true,
    };
    expect(normalizeIssueInput(value)).toEqual(input());
    expect(value.title).toBe(' Valid title ');
  });

  it('shares the same editable rules with persisted collection validation', () => {
    const issue = {
      ...input(),
      id: 'id',
      createdAt: '2026-11-20T10:00:00.000Z',
      updatedAt: '2026-11-20T10:00:00.000Z',
    };
    expect(isIssueCollection([issue])).toBe(true);
    expect(isIssueCollection([{ ...issue, status: 'closed' }])).toBe(false);
    expect(isIssueCollection([issue, issue])).toBe(false);
  });
});
