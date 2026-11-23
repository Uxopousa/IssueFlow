import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { Issue, IssueInput } from '../../../../core/models/issue.model';
import { IssueOperationResult, IssueService } from '../../../../core/services/issue.service';
import { IssueFormPageComponent } from './issue-form-page.component';

const existingIssue: Readonly<Issue> = {
  id: 'issue-1',
  title: 'Existing issue',
  description: 'A description long enough for a valid issue.',
  category: 'Backend',
  priority: 'high',
  status: 'in-progress',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-02T10:00:00.000Z',
};

const validInput: IssueInput = {
  title: 'New issue',
  description: 'A description long enough for a valid issue.',
  category: 'Backend',
  priority: 'medium',
  status: 'open',
};

@Component({ standalone: true, template: '' })
class TestIssueListPage {}

describe('IssueFormPageComponent', () => {
  let routeId: string | null;
  let createIssue: ReturnType<typeof vi.fn>;
  let updateIssue: ReturnType<typeof vi.fn>;
  let getIssue: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    routeId = null;
    createIssue = vi.fn((): IssueOperationResult<Readonly<Issue>> => ({
      status: 'saved',
      value: existingIssue,
    }));
    updateIssue = vi.fn((): IssueOperationResult<Readonly<Issue>> => ({
      status: 'saved',
      value: existingIssue,
    }));
    getIssue = vi.fn((id: string) => (id === existingIssue.id ? existingIssue : undefined));

    await TestBed.configureTestingModule({
      imports: [IssueFormPageComponent],
      providers: [
        provideRouter([{ path: 'issues', component: TestIssueListPage }]),
        {
          provide: ActivatedRoute,
          useFactory: () => ({
            snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) },
          }),
        },
        {
          provide: IssueService,
          useValue: { create: createIssue, update: updateIssue, getById: getIssue },
        },
      ],
    }).compileComponents();
  });

  function createPage(id: string | null = null) {
    routeId = id;
    const fixture = TestBed.createComponent(IssueFormPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  async function submit(fixture: ReturnType<typeof createPage>): Promise<void> {
    fixture.nativeElement
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function fillForm(fixture: ReturnType<typeof createPage>, input: IssueInput): void {
    const element = fixture.nativeElement as HTMLElement;
    setValue(element.querySelector<HTMLInputElement>('#issue-title'), input.title);
    setValue(element.querySelector<HTMLTextAreaElement>('#issue-description'), input.description);
    setValue(element.querySelector<HTMLInputElement>('#issue-category'), input.category);
    setValue(element.querySelector<HTMLSelectElement>('#issue-priority'), input.priority);
    setValue(element.querySelector<HTMLSelectElement>('#issue-status'), input.status);
  }

  function setValue(
    control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null,
    value: string,
  ): void {
    if (!control) throw new Error('Expected form control to be rendered.');
    control.value = value;
    control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input'));
  }

  it('creates an issue and navigates to the list after it is saved', async () => {
    const fixture = createPage();
    const router = TestBed.inject(Router);
    fillForm(fixture, validInput);

    await submit(fixture);

    expect(createIssue).toHaveBeenCalledWith(validInput);
    expect(router.url).toBe('/issues');
  });

  it('shows field errors and does not submit values outside the domain limits', async () => {
    const fixture = createPage();
    fillForm(fixture, {
      title: '  ',
      description: '123456789',
      category: 'x',
      priority: 'medium',
      status: 'open',
    });

    await submit(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(createIssue).not.toHaveBeenCalled();
    expect(element.querySelector('#issue-title')?.getAttribute('aria-invalid')).toBe('true');
    expect(element.querySelector('#title-error')?.textContent).toContain('obligatorio');
    expect(element.querySelector('#description-error')?.textContent).toContain('al menos 10');
    expect(element.querySelector('#category-error')?.textContent).toContain('al menos 2');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Revisa los campos');
  });

  it('rejects text over the configured maximum length before calling the service', async () => {
    const fixture = createPage();
    fillForm(fixture, {
      ...validInput,
      title: 'a'.repeat(101),
      description: 'a'.repeat(1001),
      category: 'a'.repeat(51),
    });

    await submit(fixture);

    const element = fixture.nativeElement as HTMLElement;
    expect(createIssue).not.toHaveBeenCalled();
    expect(element.querySelector('#title-error')?.textContent).toContain('No superes los 100');
    expect(element.querySelector('#description-error')?.textContent).toContain(
      'No superes los 1000',
    );
    expect(element.querySelector('#category-error')?.textContent).toContain('No superes los 50');
  });

  it('loads existing values and sends only editable fields to the update operation', async () => {
    const fixture = createPage(existingIssue.id);
    const element = fixture.nativeElement as HTMLElement;
    const backLink = element.querySelector<HTMLAnchorElement>('a[routerLink="/issues"]');
    expect(backLink?.textContent?.trim()).toBe('Cancelar');
    expect(element.querySelector<HTMLInputElement>('#issue-title')?.value).toBe(
      existingIssue.title,
    );
    expect(element.querySelector<HTMLTextAreaElement>('#issue-description')?.value).toBe(
      existingIssue.description,
    );
    expect(element.querySelector<HTMLInputElement>('#issue-category')?.value).toBe(
      existingIssue.category,
    );
    expect(element.querySelector<HTMLSelectElement>('#issue-priority')?.value).toBe(
      existingIssue.priority,
    );
    expect(element.querySelector<HTMLSelectElement>('#issue-status')?.value).toBe(
      existingIssue.status,
    );

    setValue(element.querySelector<HTMLInputElement>('#issue-title'), 'Updated issue');
    await submit(fixture);

    expect(updateIssue).toHaveBeenCalledWith(existingIssue.id, {
      title: 'Updated issue',
      description: existingIssue.description,
      category: existingIssue.category,
      priority: existingIssue.priority,
      status: existingIssue.status,
    });
    expect(fixture.nativeElement.textContent).toContain('Los cambios se guardaron correctamente');
    expect(backLink?.textContent?.trim()).toBe('Volver al listado');
  });

  it('reports when a valid operation remains only in memory', async () => {
    createIssue.mockReturnValue({
      status: 'memory-only',
      value: existingIssue,
      error: 'write-failed',
    });
    const fixture = createPage();
    fillForm(fixture, validInput);

    await submit(fixture);

    expect(fixture.nativeElement.textContent).toContain('permanecen solo en memoria');
    expect(fixture.nativeElement.textContent).toContain('no se guardaron');
    expect(fixture.nativeElement.textContent).toContain('rechazó la escritura');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLAnchorElement>('a[routerLink="/issues"]')
        ?.textContent?.trim(),
    ).toBe('Volver al listado');
  });

  it('reports a rejected operation without claiming the issue was saved', async () => {
    createIssue.mockReturnValue({ status: 'rejected', error: { code: 'generation-failed' } });
    const fixture = createPage();
    fillForm(fixture, validInput);

    await submit(fixture);

    expect(fixture.nativeElement.textContent).toContain('No se pudo preparar la incidencia');
    expect(fixture.nativeElement.textContent).not.toContain('se guardó correctamente');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLAnchorElement>('a[routerLink="/issues"]')
        ?.textContent?.trim(),
    ).toBe('Cancelar');
  });

  it('shows a useful exit when the edit route references a missing issue', () => {
    const fixture = createPage('missing-issue');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Incidencia no encontrada');
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('a[routerLink="/issues"]')?.textContent).toContain(
      'Volver al listado',
    );
    expect(getIssue).toHaveBeenCalledWith('missing-issue');
  });
});
