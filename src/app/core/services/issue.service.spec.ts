import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Issue, IssueInput } from '../models/issue.model';
import { IssueStorageService, LoadIssuesResult, SaveIssuesResult } from './issue-storage.service';
import { ISSUE_CLOCK, ISSUE_ID_GENERATOR, IssueService } from './issue.service';

const INITIAL_DATE = '2026-11-20T10:00:00.000Z';
const NEXT_DATE = '2026-11-20T11:00:00.000Z';

function input(overrides: Partial<IssueInput> = {}): IssueInput {
  return {
    title: 'Example issue',
    description: 'Description of the issue',
    category: 'General',
    priority: 'medium',
    status: 'open',
    ...overrides,
  };
}

function existing(): Issue {
  return { ...input(), id: 'existing', createdAt: INITIAL_DATE, updatedAt: INITIAL_DATE };
}

describe('IssueService', () => {
  let load: ReturnType<typeof vi.fn<() => LoadIssuesResult>>;
  let save: ReturnType<typeof vi.fn<(issues: readonly Issue[]) => SaveIssuesResult>>;
  let generateId: ReturnType<typeof vi.fn<() => string>>;
  let clock: ReturnType<typeof vi.fn<() => string>>;

  beforeEach(() => {
    load = vi.fn(() => ({ ok: true, issues: [] }));
    save = vi.fn(() => ({ ok: true }));
    generateId = vi.fn(() => 'new-id');
    clock = vi.fn(() => NEXT_DATE);
    TestBed.configureTestingModule({
      providers: [
        { provide: IssueStorageService, useValue: { load, save } },
        { provide: ISSUE_ID_GENERATOR, useValue: generateId },
        { provide: ISSUE_CLOCK, useValue: clock },
      ],
    });
  });

  function service(): IssueService {
    return TestBed.inject(IssueService);
  }

  it('loads once without writing and exposes an initially clean state', () => {
    const instance = service();
    expect(instance.issues()).toEqual([]);
    expect(instance.statistics()).toEqual({ total: 0, open: 0, inProgress: 0, resolved: 0 });
    expect(instance.persistenceError()).toBeNull();
    expect(instance.hasPendingChanges()).toBe(false);
    expect(service()).toBe(instance);
    expect(load).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
  });

  it('exposes immutable statistics derived from the full collection', () => {
    load.mockReturnValue({
      ok: true,
      issues: [
        existing(),
        { ...existing(), id: 'other-open' },
        { ...existing(), id: 'in-progress', status: 'in-progress' },
        { ...existing(), id: 'resolved', status: 'resolved' },
      ],
    });
    const instance = service();

    expect(instance.statistics()).toEqual({ total: 4, open: 2, inProgress: 1, resolved: 1 });
    instance.setSearchQuery('no matching issue');
    instance.setStatusFilter('resolved');
    instance.setPriorityFilter('high');
    expect(instance.filteredIssues()).toEqual([]);
    expect(instance.statistics()).toEqual({ total: 4, open: 2, inProgress: 1, resolved: 1 });
    expect(Object.isFrozen(instance.statistics())).toBe(true);
    expect(Reflect.set(instance.statistics(), 'total', 0)).toBe(false);
    expect(instance.statistics().total).toBe(4);
  });

  it('recomputes statistics after each successful issue operation', () => {
    load.mockReturnValue({
      ok: true,
      issues: [
        existing(),
        { ...existing(), id: 'other-open' },
        { ...existing(), id: 'in-progress', status: 'in-progress' },
        { ...existing(), id: 'resolved', status: 'resolved' },
      ],
    });
    const instance = service();

    expect(instance.create(input({ status: 'in-progress' })).status).toBe('saved');
    expect(instance.statistics()).toEqual({ total: 5, open: 2, inProgress: 2, resolved: 1 });

    expect(instance.update('existing', input({ status: 'resolved' })).status).toBe('saved');
    expect(instance.statistics()).toEqual({ total: 5, open: 1, inProgress: 2, resolved: 2 });

    expect(instance.changeStatus('in-progress', 'resolved').status).toBe('saved');
    expect(instance.statistics()).toEqual({ total: 5, open: 1, inProgress: 1, resolved: 3 });

    expect(instance.delete('other-open').status).toBe('saved');
    expect(instance.statistics()).toEqual({ total: 4, open: 0, inProgress: 1, resolved: 3 });
  });

  it('keeps statistics unchanged after rejected operations', () => {
    load.mockReturnValue({ ok: true, issues: [existing()] });
    const instance = service();
    const before = instance.statistics();

    expect(instance.update('missing', input()).status).toBe('rejected');
    expect(instance.delete('missing').status).toBe('rejected');

    expect(instance.statistics()).toEqual(before);
  });

  it('updates statistics for memory-only changes without clearing the storage error', () => {
    save.mockReturnValueOnce({ ok: false, error: 'write-failed' });
    const instance = service();

    expect(instance.create(input({ status: 'resolved' })).status).toBe('memory-only');

    expect(instance.statistics()).toEqual({ total: 1, open: 0, inProgress: 0, resolved: 1 });
    expect(instance.hasPendingChanges()).toBe(true);
    expect(instance.persistenceError()).toEqual({ phase: 'save', code: 'write-failed' });
  });

  it('copies and freezes loaded state and lookup results', () => {
    const original = existing();
    const collection = [original];
    load.mockReturnValue({ ok: true, issues: collection });
    const instance = service();
    original.title = 'External change';
    collection.length = 0;
    expect(instance.getById('existing')?.title).toBe('Example issue');
    expect(Object.isFrozen(instance.issues())).toBe(true);
    expect(Object.isFrozen(instance.getById('existing'))).toBe(true);
    expect(Reflect.set(instance.issues(), 'length', 0)).toBe(false);
    expect(Reflect.set(instance.issues()[0] ?? {}, 'title', 'External mutation')).toBe(false);
    expect(instance.getById('existing')?.title).toBe('Example issue');
    expect(instance.getById('missing')).toBeUndefined();
  });

  it('exposes immutable filters and derives case-insensitive search results', () => {
    load.mockReturnValue({
      ok: true,
      issues: [
        existing(),
        { ...existing(), id: 'other', title: 'Other issue', description: 'Account is locked' },
      ],
    });
    const instance = service();
    expect(instance.filteredIssues()).toHaveLength(2);
    expect(Object.isFrozen(instance.filters())).toBe(true);
    expect(Object.isFrozen(instance.filteredIssues())).toBe(true);

    instance.setSearchQuery('  ACCOUNT  ');

    expect(instance.filters().query).toBe('  ACCOUNT  ');
    expect(instance.filteredIssues().map((issue) => issue.id)).toEqual(['other']);
    expect(instance.issues()).toHaveLength(2);
  });

  it('combines filters and clears each criterion with its explicit empty value', () => {
    load.mockReturnValue({
      ok: true,
      issues: [
        existing(),
        {
          ...existing(),
          id: 'matching-high',
          title: 'Example issue with matching priority',
          priority: 'high',
        },
        {
          ...existing(),
          id: 'resolved-high',
          title: 'Example issue resolved',
          priority: 'high',
          status: 'resolved',
        },
      ],
    });
    const instance = service();
    instance.setSearchQuery(' example issue ');
    instance.setStatusFilter('open');
    instance.setPriorityFilter('high');

    expect(instance.filteredIssues().map((issue) => issue.id)).toEqual(['matching-high']);

    instance.setStatusFilter(null);
    expect(instance.filteredIssues().map((issue) => issue.id)).toEqual([
      'matching-high',
      'resolved-high',
    ]);
    instance.setPriorityFilter(null);
    expect(instance.filteredIssues().map((issue) => issue.id)).toEqual([
      'existing',
      'matching-high',
      'resolved-high',
    ]);
    instance.setSearchQuery('');
    expect(instance.filteredIssues()).toEqual(instance.issues());
  });

  it('recomputes filtered results after issue operations', () => {
    load.mockReturnValue({ ok: true, issues: [existing()] });
    const instance = service();
    instance.setStatusFilter('open');
    expect(instance.filteredIssues().map((issue) => issue.id)).toEqual(['existing']);

    instance.create(input({ title: 'New issue' }));
    expect(instance.filteredIssues().map((issue) => issue.id)).toEqual(['existing', 'new-id']);

    instance.changeStatus('new-id', 'resolved');
    expect(instance.filteredIssues().map((issue) => issue.id)).toEqual(['existing']);

    instance.update('existing', input({ title: 'Renamed issue' }));
    instance.setSearchQuery('renamed');
    expect(instance.filteredIssues().map((issue) => issue.id)).toEqual(['existing']);

    instance.delete('existing');
    expect(instance.filteredIssues()).toEqual([]);
  });

  it('preserves internal search spaces and treats whitespace-only search as inactive', () => {
    load.mockReturnValue({ ok: true, issues: [existing()] });
    const instance = service();
    instance.setSearchQuery('Fix  login');
    expect(instance.filteredIssues()).toEqual([]);

    instance.setSearchQuery('   ');
    expect(instance.filteredIssues().map((issue) => issue.id)).toEqual(['existing']);
  });

  it('creates normalized content, generates audit fields and writes once', () => {
    const instance = service();
    const candidate = {
      ...input({
        title: '  Example issue  ',
        description: '  Long description  ',
        category: '  General  ',
      }),
      id: 'injected',
      createdAt: 'injected',
    };
    const result = instance.create(candidate);
    expect(result.status).toBe('saved');
    expect(instance.issues()).toEqual([
      {
        ...input({ description: 'Long description' }),
        id: 'new-id',
        createdAt: NEXT_DATE,
        updatedAt: NEXT_DATE,
      },
    ]);
    candidate.title = 'External change';
    expect(instance.issues()[0]?.title).toBe('Example issue');
    expect(save).toHaveBeenCalledTimes(1);
    expect(instance.hasPendingChanges()).toBe(false);
    if (result.status !== 'rejected') expect(Object.isFrozen(result.value)).toBe(true);
  });

  it('updates all editable fields while preserving id and creation date', () => {
    load.mockReturnValue({ ok: true, issues: [existing()] });
    const instance = service();
    const result = instance.update(
      'existing',
      input({ title: '  Edited issue  ', status: 'resolved' }),
    );
    expect(result.status).toBe('saved');
    expect(instance.getById('existing')).toEqual({
      ...existing(),
      title: 'Edited issue',
      status: 'resolved',
      updatedAt: NEXT_DATE,
    });
    expect(generateId).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it.each(['open', 'in-progress', 'resolved'] as const)(
    'changes status to %s and updates only its modification date',
    (status) => {
      load.mockReturnValue({ ok: true, issues: [existing()] });
      const instance = service();
      expect(instance.changeStatus('existing', status).status).toBe('saved');
      expect(instance.getById('existing')).toEqual({ ...existing(), status, updatedAt: NEXT_DATE });
      expect(save).toHaveBeenCalledTimes(1);
    },
  );

  it('deletes an issue and persists the remaining collection', () => {
    load.mockReturnValue({ ok: true, issues: [existing()] });
    const instance = service();
    expect(instance.delete('existing').status).toBe('saved');
    expect(instance.issues()).toEqual([]);
    expect(save).toHaveBeenCalledWith([]);
    expect(clock).not.toHaveBeenCalled();
  });

  it('rejects missing identifiers for all operations without changing state', () => {
    const instance = service();
    expect(instance.update('missing', input())).toEqual({
      status: 'rejected',
      error: { code: 'not-found' },
    });
    expect(instance.delete('missing')).toEqual({
      status: 'rejected',
      error: { code: 'not-found' },
    });
    expect(instance.changeStatus('missing', 'open')).toEqual({
      status: 'rejected',
      error: { code: 'not-found' },
    });
    expect(save).not.toHaveBeenCalled();
    expect(clock).not.toHaveBeenCalled();
  });

  it('rejects invalid content in create and update with field errors', () => {
    load.mockReturnValue({ ok: true, issues: [existing()] });
    const instance = service();
    for (const result of [
      instance.create(input({ title: ' ' })),
      instance.update('existing', input({ title: ' ' })),
    ]) {
      expect(result).toEqual({
        status: 'rejected',
        error: { code: 'validation', fields: { title: 'invalid' } },
      });
    }
    expect(instance.issues()).toEqual([existing()]);
    expect(save).not.toHaveBeenCalled();
    expect(generateId).not.toHaveBeenCalled();
    expect(clock).not.toHaveBeenCalled();
  });

  it('rejects invalid status at runtime without touching audit fields', () => {
    load.mockReturnValue({ ok: true, issues: [existing()] });
    const instance = service();
    // @ts-expect-error Exercise untrusted runtime data at the public boundary.
    const result = instance.changeStatus('existing', 'closed');
    expect(result).toEqual({
      status: 'rejected',
      error: { code: 'validation', fields: { status: 'invalid' } },
    });
    expect(clock).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it.each<keyof IssueInput>(['title', 'description', 'category', 'priority', 'status'])(
    'rejects inherited %s through create and update',
    (field) => {
      load.mockReturnValue({ ok: true, issues: [existing()] });
      const candidate = input();
      Object.setPrototypeOf(candidate, { [field]: candidate[field] });
      Reflect.deleteProperty(candidate, field);
      const instance = service();
      for (const result of [instance.create(candidate), instance.update('existing', candidate)]) {
        expect(result).toEqual({
          status: 'rejected',
          error: { code: 'validation', fields: { [field]: 'invalid' } },
        });
      }
      expect(instance.issues()).toEqual([existing()]);
      expect(save).not.toHaveBeenCalled();
    },
  );

  it('keeps rejected operations from clearing outstanding persistence errors', () => {
    load.mockReturnValue({ ok: false, error: 'read-failed' });
    const instance = service();
    instance.create(input({ title: '' }));
    expect(instance.persistenceError()).toEqual({ phase: 'load', code: 'read-failed' });
    expect(instance.hasPendingChanges()).toBe(false);
    expect(save).not.toHaveBeenCalled();
  });

  it('does not expose a mutable persistence error', () => {
    load.mockReturnValue({ ok: false, error: 'read-failed' });
    expect(Object.isFrozen(service().persistenceError())).toBe(true);
  });

  it.each(['', '   ', 'existing'])('rejects unusable generated identifier %j', (id) => {
    load.mockReturnValue({ ok: true, issues: [existing()] });
    generateId.mockReturnValue(id);
    const instance = service();
    expect(instance.create(input())).toEqual({
      status: 'rejected',
      error: { code: 'generation-failed' },
    });
    expect(instance.issues()).toEqual([existing()]);
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects generator exceptions without a partial mutation', () => {
    generateId.mockImplementation(() => {
      throw new Error('No crypto');
    });
    const instance = service();
    expect(instance.create(input()).status).toBe('rejected');
    expect(instance.issues()).toEqual([]);
    expect(save).not.toHaveBeenCalled();
  });

  it.each(['invalid', '2026-11-20'])('rejects an invalid generated date %s', (date) => {
    clock.mockReturnValue(date);
    load.mockReturnValue({ ok: true, issues: [existing()] });
    const instance = service();
    expect(instance.create(input()).status).toBe('rejected');
    expect(instance.update('existing', input()).status).toBe('rejected');
    expect(instance.changeStatus('existing', 'resolved').status).toBe('rejected');
    expect(instance.issues()).toEqual([existing()]);
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects clock exceptions without modifying existing issues', () => {
    clock.mockImplementation(() => {
      throw new Error('Clock unavailable');
    });
    load.mockReturnValue({ ok: true, issues: [existing()] });
    const instance = service();
    expect(instance.update('existing', input()).status).toBe('rejected');
    expect(instance.issues()).toEqual([existing()]);
    expect(save).not.toHaveBeenCalled();
  });

  it('keeps failed writes in memory and retries the current collection', () => {
    save.mockReturnValueOnce({ ok: false, error: 'write-failed' });
    const instance = service();
    expect(instance.create(input()).status).toBe('memory-only');
    expect(instance.hasPendingChanges()).toBe(true);
    expect(instance.persistenceError()).toEqual({ phase: 'save', code: 'write-failed' });
    expect(instance.getById('new-id')).toBeDefined();
    expect(instance.retrySave()).toEqual({ status: 'saved', value: undefined });
    expect(save).toHaveBeenCalledTimes(2);
    expect(instance.persistenceError()).toBeNull();
    expect(instance.hasPendingChanges()).toBe(false);
  });

  it('preserves edits, status changes and deletion when writes fail', () => {
    load.mockReturnValue({ ok: true, issues: [existing()] });
    save.mockReturnValue({ ok: false, error: 'storage-unavailable' });
    const instance = service();
    expect(instance.update('existing', input({ title: 'Edited issue' })).status).toBe(
      'memory-only',
    );
    expect(instance.getById('existing')?.title).toBe('Edited issue');
    expect(instance.changeStatus('existing', 'resolved').status).toBe('memory-only');
    expect(instance.getById('existing')?.status).toBe('resolved');
    expect(instance.delete('existing').status).toBe('memory-only');
    expect(instance.issues()).toEqual([]);
    expect(instance.hasPendingChanges()).toBe(true);
    expect(save).toHaveBeenCalledTimes(3);
  });

  it('does not overwrite unread storage until replacement is explicitly authorized', () => {
    load.mockReturnValue({ ok: false, error: 'invalid-json' });
    const instance = service();
    expect(instance.persistenceError()).toEqual({ phase: 'load', code: 'invalid-json' });
    expect(instance.hasPendingChanges()).toBe(false);
    expect(instance.retrySave({ overwriteUnreadStorage: true }).status).toBe('rejected');
    expect(instance.create(input()).status).toBe('memory-only');
    expect(instance.retrySave()).toEqual({ status: 'rejected', error: { code: 'unread-storage' } });
    expect(save).not.toHaveBeenCalled();
    expect(instance.persistenceError()).toEqual({ phase: 'load', code: 'invalid-json' });
    expect(instance.retrySave({ overwriteUnreadStorage: true }).status).toBe('saved');
    expect(save).toHaveBeenCalledTimes(1);
    expect(instance.hasPendingChanges()).toBe(false);
    expect(instance.persistenceError()).toBeNull();
    expect(instance.changeStatus('new-id', 'resolved').status).toBe('saved');
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('retains the overwrite requirement when explicitly authorized saving fails', () => {
    load.mockReturnValue({ ok: false, error: 'read-failed' });
    save.mockReturnValue({ ok: false, error: 'write-failed' });
    const instance = service();
    instance.create(input());
    expect(instance.retrySave({ overwriteUnreadStorage: true }).status).toBe('memory-only');
    expect(instance.retrySave().status).toBe('rejected');
    expect(instance.changeStatus('new-id', 'resolved').status).toBe('memory-only');
    expect(save).toHaveBeenCalledTimes(1);
    expect(instance.hasPendingChanges()).toBe(true);
  });

  it('does not write when there are no pending changes', () => {
    expect(service().retrySave().status).toBe('rejected');
    expect(save).not.toHaveBeenCalled();
  });
});
