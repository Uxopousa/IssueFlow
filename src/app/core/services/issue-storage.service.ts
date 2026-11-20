import { inject, Injectable, InjectionToken } from '@angular/core';

import { Issue } from '../models/issue.model';

type IssueStorage = Pick<Storage, 'getItem' | 'setItem'>;
type IssueFields = Record<keyof Issue, unknown>;

const REQUIRED_ISSUE_FIELDS = [
  'id',
  'title',
  'description',
  'category',
  'priority',
  'status',
  'createdAt',
  'updatedAt',
] as const satisfies readonly (keyof Issue)[];

export type IssueStorageError =
  | 'storage-unavailable'
  | 'read-failed'
  | 'invalid-json'
  | 'invalid-data'
  | 'serialization-failed'
  | 'write-failed';

type StorageFailure = { ok: false; error: IssueStorageError };
export type LoadIssuesResult = { ok: true; issues: Issue[] } | StorageFailure;
export type SaveIssuesResult = { ok: true } | StorageFailure;

export const ISSUE_STORAGE_ACCESS = new InjectionToken<() => IssueStorage | undefined>(
  'ISSUE_STORAGE_ACCESS',
  { providedIn: 'root', factory: () => () => globalThis.localStorage },
);

// Persist a plain Issue array under this stable key; reads never repair or overwrite it.
const STORAGE_KEY = 'issueflow.issues';

@Injectable({ providedIn: 'root' })
export class IssueStorageService {
  private readonly accessStorage = inject(ISSUE_STORAGE_ACCESS);

  load(): LoadIssuesResult {
    const access = this.getStorage();
    if (!access.ok) {
      return access;
    }

    let serialized: string | null;
    try {
      serialized = access.storage.getItem(STORAGE_KEY);
    } catch {
      return { ok: false, error: 'read-failed' };
    }

    if (serialized === null) {
      return { ok: true, issues: [] };
    }

    let issues: unknown;
    try {
      issues = JSON.parse(serialized);
    } catch {
      return { ok: false, error: 'invalid-json' };
    }

    return isIssueCollection(issues) ? { ok: true, issues } : { ok: false, error: 'invalid-data' };
  }

  save(issues: readonly Issue[]): SaveIssuesResult {
    if (!isIssueCollection(issues)) {
      return { ok: false, error: 'invalid-data' };
    }

    let serialized: string;
    try {
      serialized = JSON.stringify(issues);
    } catch {
      return { ok: false, error: 'serialization-failed' };
    }

    const access = this.getStorage();
    if (!access.ok) {
      return access;
    }

    try {
      access.storage.setItem(STORAGE_KEY, serialized);
      return { ok: true };
    } catch {
      return { ok: false, error: 'write-failed' };
    }
  }

  private getStorage(): { ok: true; storage: IssueStorage } | StorageFailure {
    try {
      const storage = this.accessStorage();
      return storage ? { ok: true, storage } : { ok: false, error: 'storage-unavailable' };
    } catch {
      return { ok: false, error: 'storage-unavailable' };
    }
  }
}

function isIssueCollection(value: unknown): value is Issue[] {
  if (!Array.isArray(value)) {
    return false;
  }

  const identifiers = new Set<string>();
  for (const issue of value) {
    if (!isIssue(issue) || identifiers.has(issue.id)) {
      return false;
    }
    identifiers.add(issue.id);
  }
  return true;
}

function isIssue(value: unknown): value is Issue {
  return (
    hasOwnIssueFields(value) &&
    hasValidIssueContent(value) &&
    hasValidIssueClassification(value) &&
    isSerializedDate(value.createdAt) &&
    isSerializedDate(value.updatedAt)
  );
}

function hasOwnIssueFields(value: unknown): value is IssueFields {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    REQUIRED_ISSUE_FIELDS.every((field) => Object.hasOwn(value, field))
  );
}

function hasValidIssueContent(value: IssueFields): boolean {
  return (
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    hasTextLength(value.title, 3, 100) &&
    hasTextLength(value.description, 10, 1000) &&
    hasTextLength(value.category, 2, 50)
  );
}

function hasValidIssueClassification(value: IssueFields): boolean {
  return (
    (value.priority === 'low' || value.priority === 'medium' || value.priority === 'high') &&
    (value.status === 'open' || value.status === 'in-progress' || value.status === 'resolved')
  );
}

function hasTextLength(value: unknown, min: number, max: number): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const length = value.trim().length;
  return length >= min && length <= max;
}

function isSerializedDate(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}
