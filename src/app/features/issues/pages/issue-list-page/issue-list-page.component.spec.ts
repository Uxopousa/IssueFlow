import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Issue } from '../../../../core/models/issue.model';
import { IssueService } from '../../../../core/services/issue.service';
import { ISSUE_STORAGE_ACCESS } from '../../../../core/services/issue-storage.service';
import { routes } from '../../../../app.routes';
import { IssueListPageComponent } from './issue-list-page.component';

describe('IssueListPageComponent', () => {
  let storedIssues: Issue[];
  let getItem: ReturnType<typeof vi.fn>;
  let setItem: ReturnType<typeof vi.fn>;
  let confirm: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    storedIssues = [
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
    getItem = vi.fn(() => JSON.stringify(storedIssues));
    setItem = vi.fn();
    confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);

    await TestBed.configureTestingModule({
      imports: [IssueListPageComponent],
      providers: [
        provideRouter(routes),
        {
          provide: ISSUE_STORAGE_ACCESS,
          useValue: () => ({ getItem, setItem }),
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('shows issue fields, dates, and links to the existing routes', () => {
    const fixture = TestBed.createComponent(IssueListPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const issueCard = element.querySelector('article');

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Incidencias');
    expect(issueCard?.textContent).toContain('Fix login flow');
    expect(issueCard?.textContent).toContain('Authentication');
    expect(issueCard?.textContent).toContain('Media');
    expect(issueCard?.textContent).toContain('Abierta');
    expect(issueCard?.querySelector('time')?.getAttribute('datetime')).toBe(
      '2026-01-01T10:00:00.000Z',
    );
    expect(element.querySelector('a[href="/issues/issue-1"]')).not.toBeNull();
    expect(element.querySelector('a[href="/issues/issue-1/edit"]')).not.toBeNull();
    expect(element.querySelector('a[href="/issues/new"]')).not.toBeNull();
  });

  it('combines search and filters and clears them when no issues match', () => {
    const fixture = TestBed.createComponent(IssueListPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const search = element.querySelector('#issue-search') as HTMLInputElement;
    search.value = 'ACCOUNT';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const status = element.querySelector('#status-filter') as HTMLSelectElement;
    status.value = 'in-progress';
    status.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    const priority = element.querySelector('#priority-filter') as HTMLSelectElement;
    priority.value = 'high';
    priority.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(element.querySelectorAll('article')).toHaveLength(1);
    expect(element.querySelector('article')?.textContent).toContain('Improve profile');

    status.value = 'resolved';
    status.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(element.textContent).toContain('No hay coincidencias');

    const clearButton = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Limpiar búsqueda y filtros'),
    );
    clearButton?.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('article')).toHaveLength(3);
  });

  it('preserves focus on cancellation and moves it to the next issue after a confirmed delete', async () => {
    const fixture = TestBed.createComponent(IssueListPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const cancelledDeleteButton = element.querySelector(
      'button[aria-label="Eliminar Fix login flow"]',
    ) as HTMLButtonElement;
    cancelledDeleteButton.focus();
    cancelledDeleteButton.click();
    fixture.detectChanges();

    expect(confirm).toHaveBeenCalledOnce();
    expect(setItem).not.toHaveBeenCalled();
    expect(element.querySelectorAll('article')).toHaveLength(3);
    expect(document.activeElement).toBe(cancelledDeleteButton);

    confirm.mockReturnValue(true);
    const middleDeleteButton = element.querySelector(
      'button[aria-label="Eliminar Improve profile"]',
    ) as HTMLButtonElement;
    middleDeleteButton.focus();
    middleDeleteButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(setItem).toHaveBeenCalledOnce();
    expect(element.textContent).toContain('Incidencia eliminada y guardada.');
    expect(element.querySelectorAll('article')).toHaveLength(2);
    expect(document.activeElement).toBe(
      element.querySelector('[data-issue-focus][data-issue-id="issue-3"]'),
    );
  });

  it('moves focus to the clear-filters control after deleting the last visible result', async () => {
    confirm.mockReturnValue(true);
    const fixture = TestBed.createComponent(IssueListPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const search = element.querySelector('#issue-search') as HTMLInputElement;
    search.value = 'login';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(element.querySelectorAll('article')).toHaveLength(1);

    const deleteButton = element.querySelector(
      'button[aria-label="Eliminar Fix login flow"]',
    ) as HTMLButtonElement;
    deleteButton.focus();
    deleteButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('No hay coincidencias');
    expect(document.activeElement).toBe(element.querySelector('[data-list-focus="clear"]'));
  });

  it('moves focus to the create action after deleting the only issue', async () => {
    getItem.mockReturnValue(JSON.stringify([issue()]));
    confirm.mockReturnValue(true);
    const fixture = TestBed.createComponent(IssueListPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const deleteButton = element.querySelector(
      'button[aria-label="Eliminar Fix login flow"]',
    ) as HTMLButtonElement;
    deleteButton.focus();
    deleteButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('Aún no hay incidencias');
    expect(document.activeElement).toBe(element.querySelector('[data-list-focus="create"]'));
  });

  it('reports memory-only changes when storage rejects a status update', () => {
    setItem.mockImplementation(() => {
      throw new Error('storage is full');
    });
    const fixture = TestBed.createComponent(IssueListPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const select = element.querySelector('#issue-status-issue-1') as HTMLSelectElement;
    select.value = 'resolved';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(element.textContent).toContain('El cambio de estado solo está en memoria');
    expect(element.textContent).toContain('El almacenamiento local rechazó la escritura.');
    expect(select.value).toBe('resolved');
    expect(element.querySelector('[role="status"]')).not.toBeNull();
  });

  it('announces rejected status operations and restores the current value', () => {
    const issueService = TestBed.inject(IssueService);
    vi.spyOn(issueService, 'changeStatus').mockReturnValue({
      status: 'rejected',
      error: { code: 'not-found' },
    });
    const fixture = TestBed.createComponent(IssueListPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const select = element.querySelector('#issue-status-issue-1') as HTMLSelectElement;
    select.value = 'resolved';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(select.value).toBe('open');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'La incidencia ya no está disponible.',
    );
  });

  it('offers creation for an empty list', () => {
    getItem.mockReturnValue('[]');
    const emptyFixture = TestBed.createComponent(IssueListPageComponent);
    emptyFixture.detectChanges();
    expect((emptyFixture.nativeElement as HTMLElement).textContent).toContain(
      'Aún no hay incidencias',
    );
    expect(
      (emptyFixture.nativeElement as HTMLElement).querySelector('a[href="/issues/new"]'),
    ).not.toBeNull();
  });

  it('distinguishes an empty filter result and allows clearing the criteria', () => {
    const fixture = TestBed.createComponent(IssueListPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const search = element.querySelector('#issue-search') as HTMLInputElement;
    search.value = 'missing';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(element.textContent).toContain('No hay coincidencias');
    expect(
      Array.from(element.querySelectorAll('button')).some((button) =>
        button.textContent?.includes('Limpiar búsqueda y filtros'),
      ),
    ).toBe(true);
  });

  it('announces a readable persistence load error without pretending the list is empty', () => {
    getItem.mockReturnValue('{ invalid json');
    const fixture = TestBed.createComponent(IssueListPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Los datos guardados no contienen JSON válido.',
    );
    expect(element.textContent).toContain('No se pudo confirmar el contenido guardado');
  });
});

function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    title: 'Fix login flow',
    description: 'The account page cannot sign in',
    category: 'Authentication',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
    ...overrides,
  };
}
