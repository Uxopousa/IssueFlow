import { Issue, IssuePriority, IssueStatus } from './issue.model';

export interface IssueFilters {
  readonly query: string;
  readonly status: IssueStatus | null;
  readonly priority: IssuePriority | null;
}

export function filterIssues(
  issues: readonly Readonly<Issue>[],
  filters: IssueFilters,
): readonly Readonly<Issue>[] {
  const query = filters.query.trim().toLowerCase();

  return issues.filter(
    (issue) =>
      (!query ||
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query)) &&
      (filters.status === null || issue.status === filters.status) &&
      (filters.priority === null || issue.priority === filters.priority),
  );
}
