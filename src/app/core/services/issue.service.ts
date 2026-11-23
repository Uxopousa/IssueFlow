import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';

import { filterIssues, IssueFilters } from '../models/issue-filter';
import { Issue, IssueInput, IssuePriority, IssueStatus } from '../models/issue.model';
import {
  isNonEmptyIdentifier,
  isSerializedDate,
  isIssueStatus,
  IssueInputErrors,
  normalizeIssueInput,
  validateIssueInput,
} from '../models/issue-validation';
import { IssueStorageError, IssueStorageService } from './issue-storage.service';

const DEFAULT_FILTERS: Readonly<IssueFilters> = Object.freeze({
  query: '',
  status: null,
  priority: null,
});

export const ISSUE_ID_GENERATOR = new InjectionToken<() => string>('ISSUE_ID_GENERATOR', {
  providedIn: 'root',
  factory: () => () => globalThis.crypto.randomUUID(),
});
export const ISSUE_CLOCK = new InjectionToken<() => string>('ISSUE_CLOCK', {
  providedIn: 'root',
  factory: () => () => new Date().toISOString(),
});

export type IssueOperationError =
  | { code: 'validation'; fields: IssueInputErrors }
  | { code: 'not-found' | 'generation-failed' | 'unread-storage' | 'no-pending-changes' };

type RejectedOperation = { status: 'rejected'; error: IssueOperationError };
export type IssueOperationResult<Value = void> =
  | { status: 'saved'; value: Value }
  | { status: 'memory-only'; value: Value; error: IssueStorageError }
  | RejectedOperation;

export interface IssuePersistenceError {
  readonly phase: 'load' | 'save';
  readonly code: IssueStorageError;
}

export interface IssueStatistics {
  readonly total: number;
  readonly open: number;
  readonly inProgress: number;
  readonly resolved: number;
}

type IssueState = {
  readonly issues: readonly Readonly<Issue>[];
  readonly pending: boolean;
} & (
  | { readonly unreadStorage: true; readonly error: IssuePersistenceError }
  | { readonly unreadStorage: false; readonly error: IssuePersistenceError | null }
);

@Injectable({ providedIn: 'root' })
export class IssueService {
  private readonly storage = inject(IssueStorageService);
  private readonly generateId = inject(ISSUE_ID_GENERATOR);
  private readonly clock = inject(ISSUE_CLOCK);
  private readonly state = signal<IssueState>(this.loadInitialState());
  private readonly activeFilters = signal<IssueFilters>(DEFAULT_FILTERS);

  readonly issues = computed(() => this.state().issues);
  readonly statistics = computed<IssueStatistics>(() => {
    const issues = this.issues();
    const counts: Record<IssueStatus, number> = {
      open: 0,
      'in-progress': 0,
      resolved: 0,
    };

    for (const issue of issues) {
      counts[issue.status] += 1;
    }

    return Object.freeze({
      total: issues.length,
      open: counts.open,
      inProgress: counts['in-progress'],
      resolved: counts.resolved,
    });
  });
  readonly persistenceError = computed(() => this.state().error);
  readonly hasPendingChanges = computed(() => this.state().pending);
  readonly filters = computed(() => this.activeFilters());
  readonly filteredIssues = computed(() =>
    Object.freeze(filterIssues(this.issues(), this.filters())),
  );

  setSearchQuery(query: string): void {
    this.activeFilters.update((filters) => freezeFilters({ ...filters, query }));
  }

  setStatusFilter(status: IssueStatus | null): void {
    this.activeFilters.update((filters) => freezeFilters({ ...filters, status }));
  }

  setPriorityFilter(priority: IssuePriority | null): void {
    this.activeFilters.update((filters) => freezeFilters({ ...filters, priority }));
  }

  getById(id: string): Readonly<Issue> | undefined {
    return this.issues().find((issue) => issue.id === id);
  }

  create(input: IssueInput): IssueOperationResult<Readonly<Issue>> {
    const invalid = this.rejectInvalidInput(input);
    if (invalid) return invalid;

    let id: string;
    let date: string;
    try {
      id = this.generateId();
      date = this.clock();
    } catch {
      return { status: 'rejected', error: { code: 'generation-failed' } };
    }
    if (!isNonEmptyIdentifier(id) || this.getById(id) || !isSerializedDate(date)) {
      return { status: 'rejected', error: { code: 'generation-failed' } };
    }

    const issue = freezeIssue({
      ...normalizeIssueInput(input),
      id,
      createdAt: date,
      updatedAt: date,
    });
    return this.apply([...this.issues(), issue], issue);
  }

  update(id: string, input: IssueInput): IssueOperationResult<Readonly<Issue>> {
    const current = this.getById(id);
    if (!current) return { status: 'rejected', error: { code: 'not-found' } };
    const invalid = this.rejectInvalidInput(input);
    if (invalid) return invalid;
    return this.replace(current, normalizeIssueInput(input));
  }

  delete(id: string): IssueOperationResult<Readonly<Issue>> {
    const current = this.getById(id);
    if (!current) return { status: 'rejected', error: { code: 'not-found' } };
    return this.apply(
      this.issues().filter((issue) => issue.id !== id),
      current,
    );
  }

  changeStatus(id: string, status: IssueStatus): IssueOperationResult<Readonly<Issue>> {
    const current = this.getById(id);
    if (!current) return { status: 'rejected', error: { code: 'not-found' } };
    if (!isIssueStatus(status)) {
      return { status: 'rejected', error: { code: 'validation', fields: { status: 'invalid' } } };
    }
    return this.replace(current, { ...current, status });
  }

  retrySave(options: { overwriteUnreadStorage?: boolean } = {}): IssueOperationResult {
    if (!this.hasPendingChanges()) {
      return { status: 'rejected', error: { code: 'no-pending-changes' } };
    }
    if (this.state().unreadStorage && options.overwriteUnreadStorage !== true) {
      return { status: 'rejected', error: { code: 'unread-storage' } };
    }
    return this.persist(undefined);
  }

  private replace(
    current: Readonly<Issue>,
    input: IssueInput,
  ): IssueOperationResult<Readonly<Issue>> {
    let date: string;
    try {
      date = this.clock();
    } catch {
      return { status: 'rejected', error: { code: 'generation-failed' } };
    }
    if (!isSerializedDate(date)) {
      return { status: 'rejected', error: { code: 'generation-failed' } };
    }

    const issue = freezeIssue({
      ...input,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: date,
    });
    return this.apply(
      this.issues().map((item) => (item.id === current.id ? issue : item)),
      issue,
    );
  }

  private apply(
    issues: readonly Readonly<Issue>[],
    issue: Readonly<Issue>,
  ): IssueOperationResult<Readonly<Issue>> {
    this.state.update((state) => ({ ...state, issues: Object.freeze([...issues]), pending: true }));
    const state = this.state();
    if (state.unreadStorage) {
      return {
        status: 'memory-only',
        value: issue,
        error: state.error.code,
      };
    }
    return this.persist(issue);
  }

  private persist<Value>(value: Value): IssueOperationResult<Value> {
    const result = this.storage.save(this.issues());
    if (!result.ok) {
      this.state.update((state) => ({
        ...state,
        error: Object.freeze({ phase: 'save', code: result.error }),
      }));
      return { status: 'memory-only', value, error: result.error };
    }
    this.state.update((state) => ({ ...state, error: null, pending: false, unreadStorage: false }));
    return { status: 'saved', value };
  }

  private rejectInvalidInput(input: IssueInput): RejectedOperation | undefined {
    const fields = validateIssueInput(input);
    return Object.keys(fields).length
      ? { status: 'rejected', error: { code: 'validation', fields } }
      : undefined;
  }

  private loadInitialState(): IssueState {
    const result = this.storage.load();
    if (!result.ok) {
      return {
        issues: Object.freeze([]),
        error: Object.freeze({ phase: 'load', code: result.error }),
        pending: false,
        unreadStorage: true,
      };
    }
    return {
      issues: Object.freeze(result.issues.map(freezeIssue)),
      error: null,
      pending: false,
      unreadStorage: false,
    };
  }
}

function freezeIssue(issue: Readonly<Issue>): Readonly<Issue> {
  return Object.freeze({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    category: issue.category,
    priority: issue.priority,
    status: issue.status,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  });
}

function freezeFilters(filters: IssueFilters): Readonly<IssueFilters> {
  return Object.freeze({ ...filters });
}
