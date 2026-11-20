import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Issue } from '../models/issue.model';
import { ISSUE_STORAGE_ACCESS, IssueStorageService } from './issue-storage.service';

const STORAGE_KEY = 'issueflow.issues';

function createIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    title: 'Example issue',
    description: 'Description of the issue',
    category: 'General',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-11-20T10:00:00.000Z',
    updatedAt: '2026-11-20T10:00:00.000Z',
    ...overrides,
  };
}

describe('IssueStorageService', () => {
  let stored: string | null;
  let service: IssueStorageService;
  let getItem: ReturnType<typeof vi.fn<(key: string) => string | null>>;
  let setItem: ReturnType<typeof vi.fn<(key: string, value: string) => void>>;
  let access: ReturnType<typeof vi.fn<() => Pick<Storage, 'getItem' | 'setItem'> | undefined>>;

  beforeEach(() => {
    stored = null;
    getItem = vi.fn(() => stored);
    setItem = vi.fn((_key: string, value: string) => {
      stored = value;
    });
    access = vi.fn(() => ({ getItem, setItem }));
    TestBed.configureTestingModule({
      providers: [{ provide: ISSUE_STORAGE_ACCESS, useValue: access }],
    });
    service = TestBed.inject(IssueStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not access storage when instantiated', () => {
    expect(access).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each([null, '[]'])('loads an empty collection from %s without writing', (value) => {
    stored = value;

    expect(service.load()).toEqual({ ok: true, issues: [] });
    expect(getItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('round-trips all fields without normalizing texts or generating identifiers and dates', () => {
    const issues = [
      createIssue({ title: '  Example issue  ', id: 'custom-id' }),
      createIssue({ id: 'other-id', status: 'resolved', priority: 'high' }),
    ];

    expect(service.save(issues)).toEqual({ ok: true });
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(issues));
    expect(service.load()).toEqual({ ok: true, issues });
  });

  it.each<keyof Issue>([
    'id',
    'title',
    'description',
    'category',
    'priority',
    'status',
    'createdAt',
    'updatedAt',
  ])('rejects an inherited %s field without writing', (field) => {
    const issue = createIssue();
    Object.setPrototypeOf(issue, { [field]: issue[field] });
    const ownFields: Partial<Issue> = issue;
    delete ownFields[field];

    expect(service.save([issue])).toEqual({ ok: false, error: 'invalid-data' });
    expect(setItem).not.toHaveBeenCalled();
  });

  it('rejects an issue with all required fields inherited', () => {
    const issue = createIssue();
    Object.setPrototypeOf(issue, { ...issue });
    for (const field of Object.keys(issue)) {
      Reflect.deleteProperty(issue, field);
    }

    expect(service.save([issue])).toEqual({ ok: false, error: 'invalid-data' });
    expect(setItem).not.toHaveBeenCalled();
  });

  it('accepts own fields on an object with a custom prototype', () => {
    const issue = createIssue();
    Object.setPrototypeOf(issue, { source: 'prototype' });

    expect(service.save([issue])).toEqual({ ok: true });
    expect(service.load()).toEqual({ ok: true, issues: [createIssue()] });
  });

  it('accepts own fields on an object without a prototype', () => {
    const issue = createIssue();
    Object.setPrototypeOf(issue, null);

    expect(service.save([issue])).toEqual({ ok: true });
    expect(service.load()).toEqual({ ok: true, issues: [createIssue()] });
  });

  it('continues to accept additional fields', () => {
    const issue = { ...createIssue(), source: 'extra field' };

    expect(service.save([issue])).toEqual({ ok: true });
    expect(service.load()).toEqual({ ok: true, issues: [issue] });
  });

  it('saves an empty collection explicitly', () => {
    stored = JSON.stringify([createIssue()]);

    expect(service.save([])).toEqual({ ok: true });
    expect(stored).toBe('[]');
  });

  it('reports malformed JSON without replacing the original value', () => {
    stored = '{invalid';

    expect(service.load()).toEqual({ ok: false, error: 'invalid-json' });
    expect(stored).toBe('{invalid');
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each([null, {}, 'text', 1, true, [null], [[]]])(
    'rejects an invalid collection shape: %j',
    (value) => {
      stored = JSON.stringify(value);

      expect(service.load()).toEqual({ ok: false, error: 'invalid-data' });
      expect(setItem).not.toHaveBeenCalled();
    },
  );

  it.each<keyof Issue>([
    'id',
    'title',
    'description',
    'category',
    'priority',
    'status',
    'createdAt',
    'updatedAt',
  ])('rejects a missing %s field', (field) => {
    const issue: Partial<Issue> = createIssue();
    delete issue[field];
    stored = JSON.stringify([issue]);

    expect(service.load()).toEqual({ ok: false, error: 'invalid-data' });
  });

  it.each([
    ['id', 12],
    ['title', null],
    ['description', []],
    ['category', false],
    ['priority', 'urgent'],
    ['status', 'closed'],
    ['createdAt', 123],
    ['updatedAt', null],
    ['id', '   '],
    ['createdAt', 'not-a-date'],
    ['updatedAt', '2026-02-30T00:00:00.000Z'],
    ['createdAt', '2026-11-20'],
    ['updatedAt', '2026-11-20T10:00:00Z'],
    ['createdAt', '2026-11-20T11:00:00.000+01:00'],
  ])('rejects invalid %s value %j', (field, value) => {
    stored = JSON.stringify([{ ...createIssue(), [field]: value }]);

    expect(service.load()).toEqual({ ok: false, error: 'invalid-data' });
    expect(setItem).not.toHaveBeenCalled();
  });

  it.each<['title' | 'description' | 'category', number, number]>([
    ['title', 3, 100],
    ['description', 10, 1000],
    ['category', 2, 50],
  ])('checks trimmed %s length at its boundaries on load and save', (field, min, max) => {
    for (const length of [min, max]) {
      const issue = createIssue({ [field]: `  ${'x'.repeat(length)}  ` });
      expect(service.save([issue])).toEqual({ ok: true });
      expect(service.load()).toEqual({ ok: true, issues: [issue] });
    }

    for (const value of ['   ', 'x'.repeat(min - 1), 'x'.repeat(max + 1)]) {
      const issue = createIssue({ [field]: value });
      stored = JSON.stringify([issue]);
      expect(service.load()).toEqual({ ok: false, error: 'invalid-data' });
      setItem.mockClear();
      expect(service.save([issue])).toEqual({ ok: false, error: 'invalid-data' });
      expect(setItem).not.toHaveBeenCalled();
    }
  });

  it.each(['low', 'medium', 'high'] as const)('accepts priority %s', (priority) => {
    expect(service.save([createIssue({ priority })])).toEqual({ ok: true });
  });

  it.each(['open', 'in-progress', 'resolved'] as const)('accepts status %s', (status) => {
    expect(service.save([createIssue({ status })])).toEqual({ ok: true });
  });

  it('does not impose chronology or future-date restrictions', () => {
    const issue = createIssue({
      createdAt: '2099-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });

    expect(service.save([issue])).toEqual({ ok: true });
    expect(service.load()).toEqual({ ok: true, issues: [issue] });
  });

  it('rejects duplicate identifiers on load and save without replacing storage', () => {
    const issues = [createIssue(), createIssue({ title: 'Another issue' })];
    stored = JSON.stringify(issues);

    expect(service.load()).toEqual({ ok: false, error: 'invalid-data' });
    expect(service.save(issues)).toEqual({ ok: false, error: 'invalid-data' });
    expect(stored).toBe(JSON.stringify(issues));
    expect(setItem).not.toHaveBeenCalled();
  });

  it('rejects the entire collection if one record is invalid', () => {
    stored = JSON.stringify([createIssue(), createIssue({ id: 'other', title: '' })]);
    const original = stored;

    expect(service.load()).toEqual({ ok: false, error: 'invalid-data' });
    expect(stored).toBe(original);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('rejects sparse input arrays without writing', () => {
    const issues = new Array<Issue>(1);

    expect(service.save(issues)).toEqual({ ok: false, error: 'invalid-data' });
    expect(setItem).not.toHaveBeenCalled();
  });

  it('preserves saved content when a later save contains invalid data', () => {
    const issue = createIssue();
    service.save([issue]);
    setItem.mockClear();

    expect(service.save([createIssue({ title: '' })])).toEqual({
      ok: false,
      error: 'invalid-data',
    });
    expect(setItem).not.toHaveBeenCalled();
    expect(service.load()).toEqual({ ok: true, issues: [issue] });
  });

  it('reports inaccessible storage and can recover on a later call', () => {
    access.mockImplementationOnce(() => {
      throw new DOMException('Denied', 'SecurityError');
    });

    expect(service.load()).toEqual({ ok: false, error: 'storage-unavailable' });
    expect(service.load()).toEqual({ ok: true, issues: [] });
  });

  it('reports unavailable storage for both operations', () => {
    access.mockReturnValue(undefined);

    expect(service.load()).toEqual({ ok: false, error: 'storage-unavailable' });
    expect(service.save([createIssue()])).toEqual({ ok: false, error: 'storage-unavailable' });
  });

  it('catches failures obtaining storage during save', () => {
    access.mockImplementation(() => {
      throw new Error('Unavailable');
    });

    expect(service.save([createIssue()])).toEqual({ ok: false, error: 'storage-unavailable' });
    expect(setItem).not.toHaveBeenCalled();
  });

  it('reports read failures without writing and can recover', () => {
    getItem.mockImplementationOnce(() => {
      throw new Error('Read failed');
    });

    expect(service.load()).toEqual({ ok: false, error: 'read-failed' });
    expect(setItem).not.toHaveBeenCalled();
    expect(service.load()).toEqual({ ok: true, issues: [] });
  });

  it.each([
    new DOMException('Full', 'QuotaExceededError'),
    new DOMException('Denied', 'SecurityError'),
    new Error('Write failed'),
  ])('reports write failure without claiming success and can recover: %s', (error) => {
    stored = '[]';
    setItem.mockImplementationOnce(() => {
      throw error;
    });

    expect(service.save([createIssue()])).toEqual({ ok: false, error: 'write-failed' });
    expect(stored).toBe('[]');
    expect(service.save([createIssue()])).toEqual({ ok: true });
  });

  it('reports serialization errors without writing', () => {
    vi.spyOn(JSON, 'stringify').mockImplementationOnce(() => {
      throw new Error('Serialization failed');
    });

    expect(service.save([createIssue()])).toEqual({ ok: false, error: 'serialization-failed' });
    expect(setItem).not.toHaveBeenCalled();
  });
});
