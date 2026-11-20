import { inject, Injectable, InjectionToken } from '@angular/core';

import { Issue } from '../models/issue.model';
import { isIssueCollection } from '../models/issue-validation';

type IssueStorage = Pick<Storage, 'getItem' | 'setItem'>;
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
