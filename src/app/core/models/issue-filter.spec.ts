import { describe, expect, it } from 'vitest';

import { Issue } from './issue.model';
import { filterIssues, IssueFilters } from './issue-filter';

function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    title: 'Fix login flow',
    description: 'The account page cannot sign in',
    category: 'Authentication',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function filters(overrides: Partial<IssueFilters> = {}): IssueFilters {
  return { query: '', status: null, priority: null, ...overrides };
}

describe('filterIssues', () => {
  const issues = [
    issue(),
    issue({
      id: 'issue-2',
      title: 'Improve profile',
      description: 'Update account details',
      priority: 'high',
      status: 'in-progress',
    }),
    issue({
      id: 'issue-3',
      title: 'Document deployment',
      description: 'Write the release checklist',
      priority: 'low',
      status: 'resolved',
    }),
  ];

  it('returns every issue in its original order when no filters are active', () => {
    expect(filterIssues(issues, filters())).toEqual(issues);
  });

  it('searches titles and descriptions without case sensitivity', () => {
    expect(filterIssues(issues, filters({ query: '  LOGIN  ' }))).toEqual([issues[0]]);
    expect(filterIssues(issues, filters({ query: 'ACCOUNT DETAILS' }))).toEqual([issues[1]]);
  });

  it('applies status and priority filters independently', () => {
    expect(filterIssues(issues, filters({ status: 'resolved' }))).toEqual([issues[2]]);
    expect(filterIssues(issues, filters({ priority: 'high' }))).toEqual([issues[1]]);
  });

  it('combines query, status, and priority filters', () => {
    expect(
      filterIssues(issues, filters({ query: 'account', status: 'in-progress', priority: 'high' })),
    ).toEqual([issues[1]]);
    expect(
      filterIssues(issues, filters({ query: 'account', status: 'resolved', priority: 'high' })),
    ).toEqual([]);
  });

  it('returns an empty result for an empty source or a query with no matches', () => {
    expect(filterIssues([], filters())).toEqual([]);
    expect(filterIssues(issues, filters({ query: 'missing' }))).toEqual([]);
  });

  it('does not mutate the source collection', () => {
    const source = [...issues];
    filterIssues(source, filters({ priority: 'low' }));
    expect(source).toEqual(issues);
    expect(source).toHaveLength(3);
  });
});
