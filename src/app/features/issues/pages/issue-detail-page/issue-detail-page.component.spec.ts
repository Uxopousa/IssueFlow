import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Issue } from '../../../../core/models/issue.model';
import { IssueOperationResult, IssueService } from '../../../../core/services/issue.service';
import { IssueDetailPageComponent } from './issue-detail-page.component';

const existingIssue: Readonly<Issue> = {
  id: 'issue-1',
  title: 'Existing issue',
  description: 'A detailed description for this issue.',
  category: 'Backend',
  priority: 'high',
  status: 'in-progress',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-02T10:00:00.000Z',
};

describe('IssueDetailPageComponent', () => {
  let routeParamMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let deleteIssue: ReturnType<typeof vi.fn>;
  let confirm: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    routeParamMap = new BehaviorSubject(convertToParamMap({ id: existingIssue.id }));
    deleteIssue = vi.fn((): IssueOperationResult<Readonly<Issue>> => ({
      status: 'saved',
      value: existingIssue,
    }));
    confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);

    await TestBed.configureTestingModule({
      imports: [IssueDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useFactory: () => ({
            snapshot: { paramMap: routeParamMap.value },
            paramMap: routeParamMap.asObservable(),
          }),
        },
        {
          provide: IssueService,
          useValue: { issues: signal([existingIssue]), delete: deleteIssue },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => vi.unstubAllGlobals());

  function createPage(id: string | null = existingIssue.id) {
    routeParamMap.next(convertToParamMap(id ? { id } : {}));
    const fixture = TestBed.createComponent(IssueDetailPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  function clickDelete(fixture: ReturnType<typeof createPage>): void {
    fixture.nativeElement.querySelector('button')?.click();
    fixture.detectChanges();
  }

  it('shows all issue details and links to editing and the list', () => {
    const fixture = createPage();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain(existingIssue.title);
    expect(element.textContent).toContain(existingIssue.description);
    expect(element.textContent).toContain(existingIssue.category);
    expect(element.textContent).toContain('Alta');
    expect(element.textContent).toContain('En progreso');
    expect(element.querySelector('time[datetime="2026-01-01T10:00:00.000Z"]')).not.toBeNull();
    expect(element.querySelector('time[datetime="2026-01-02T10:00:00.000Z"]')).not.toBeNull();
    expect(element.querySelector('a[href="/issues/issue-1/edit"]')?.textContent).toContain(
      'Editar incidencia',
    );
    expect(element.querySelector('a[href="/issues"]')?.textContent).toContain('Volver al listado');
  });

  it('offers a useful return when the route identifier does not exist', () => {
    const fixture = createPage('missing-issue');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Incidencia no encontrada');
    expect(element.textContent).toContain('Puede que la incidencia se haya eliminado');
    expect(element.querySelector('a[href="/issues"]')?.textContent).toContain('Volver al listado');
    expect(element.querySelector('button')).toBeNull();
  });

  it('does not delete or navigate when the user cancels confirmation', () => {
    const fixture = createPage();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    confirm.mockReturnValue(false);

    clickDelete(fixture);

    expect(confirm).toHaveBeenCalledWith('¿Quieres eliminar la incidencia «Existing issue»?');
    expect(deleteIssue).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('returns to the list with a saved notice after a confirmed deletion', async () => {
    const fixture = createPage();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    confirm.mockReturnValue(true);

    clickDelete(fixture);
    await fixture.whenStable();

    expect(deleteIssue).toHaveBeenCalledWith(existingIssue.id);
    expect(navigate).toHaveBeenCalledWith('/issues', {
      state: { issueDeleteStatus: 'saved' },
    });
  });

  it('returns to the list and preserves memory-only outcome after a storage failure', () => {
    deleteIssue.mockReturnValue({
      status: 'memory-only',
      value: existingIssue,
      error: 'write-failed',
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    confirm.mockReturnValue(true);
    const fixture = createPage();

    clickDelete(fixture);

    expect(navigate).toHaveBeenCalledWith('/issues', {
      state: { issueDeleteStatus: 'memory-only' },
    });
  });

  it('keeps the detail visible and reports rejected deletion', () => {
    deleteIssue.mockReturnValue({ status: 'rejected', error: { code: 'not-found' } });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    confirm.mockReturnValue(true);
    const fixture = createPage();

    clickDelete(fixture);

    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'La incidencia ya no está disponible. Vuelve al listado.',
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
