import { Issue, IssueInput, IssuePriority, IssueStatus } from './issue.model';

const INPUT_FIELDS = ['title', 'description', 'category', 'priority', 'status'] as const;
const REQUIRED_ISSUE_FIELDS = ['id', ...INPUT_FIELDS, 'createdAt', 'updatedAt'] as const;

export type IssueInputErrors = Partial<Record<keyof IssueInput, 'invalid'>>;

const INPUT_RULES: Record<keyof IssueInput, (value: unknown) => boolean> = {
  title: (value) => hasTextLength(value, 3, 100),
  description: (value) => hasTextLength(value, 10, 1000),
  category: (value) => hasTextLength(value, 2, 50),
  priority: isIssuePriority,
  status: isIssueStatus,
};

export function validateIssueInput(value: unknown): IssueInputErrors {
  const errors: IssueInputErrors = {};
  for (const field of INPUT_FIELDS) {
    if (!hasOwnFields(value, [field]) || !INPUT_RULES[field](value[field])) {
      errors[field] = 'invalid';
    }
  }
  return errors;
}

export function normalizeIssueInput(value: IssueInput): IssueInput {
  return {
    title: value.title.trim(),
    description: value.description.trim(),
    category: value.category.trim(),
    priority: value.priority,
    status: value.status,
  };
}

export function isIssueCollection(value: unknown): value is Issue[] {
  if (!Array.isArray(value)) return false;

  const identifiers = new Set<string>();
  for (const issue of value) {
    if (!isIssue(issue) || identifiers.has(issue.id)) return false;
    identifiers.add(issue.id);
  }
  return true;
}

export function isIssue(value: unknown): value is Issue {
  return (
    hasOwnFields(value, REQUIRED_ISSUE_FIELDS) &&
    isNonEmptyIdentifier(value.id) &&
    Object.keys(validateIssueInput(value)).length === 0 &&
    isSerializedDate(value.createdAt) &&
    isSerializedDate(value.updatedAt)
  );
}

export function isIssueStatus(value: unknown): value is IssueStatus {
  return value === 'open' || value === 'in-progress' || value === 'resolved';
}

function isIssuePriority(value: unknown): value is IssuePriority {
  return value === 'low' || value === 'medium' || value === 'high';
}

export function isNonEmptyIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isSerializedDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function hasOwnFields<Field extends string>(
  value: unknown,
  fields: readonly Field[],
): value is Record<Field, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    fields.every((field) => Object.hasOwn(value, field))
  );
}

function hasTextLength(value: unknown, min: number, max: number): boolean {
  if (typeof value !== 'string') return false;
  const length = value.trim().length;
  return length >= min && length <= max;
}
