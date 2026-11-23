import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { Issue } from './core/models/issue.model';
import { ISSUE_STORAGE_ACCESS } from './core/services/issue-storage.service';
import { App } from './app';
import { appConfig } from './app.config';
import { IssueDetailPageComponent } from './features/issues/pages/issue-detail-page/issue-detail-page.component';

describe('App', () => {
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();

  beforeEach(async () => {
    getItem.mockReset();
    getItem.mockReturnValue(null);
    setItem.mockReset();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        ...appConfig.providers,
        {
          provide: ISSUE_STORAGE_ACCESS,
          useValue: () => ({ getItem, setItem }),
        },
      ],
    }).compileComponents();
  });

  it('renders the accessible app shell and primary navigation', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const navigation = element.querySelector('nav[aria-label="Navegación principal"]');

    expect(element.querySelector('a[href="#main-content"]')?.textContent?.trim()).toBe(
      'Saltar al contenido',
    );
    expect(element.querySelectorAll('main')).toHaveLength(1);
    expect(navigation?.textContent).toContain('Panel');
    expect(navigation?.textContent).toContain('Incidencias');
  });

  it('loads the issue service once during application initialization', async () => {
    const host = document.createElement('app-root');
    document.body.append(host);
    let application: Awaited<ReturnType<typeof bootstrapApplication>> | undefined;

    try {
      application = await bootstrapApplication(App, {
        providers: [
          ...appConfig.providers,
          {
            provide: ISSUE_STORAGE_ACCESS,
            useValue: () => ({ getItem, setItem }),
          },
        ],
      });

      expect(getItem).toHaveBeenCalledTimes(1);
      expect(getItem).toHaveBeenCalledWith('issueflow.issues');
    } finally {
      application?.destroy();
      host.remove();
    }
  });

  it('moves focus to the main landmark after client-side navigation', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/dashboard');
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const main = element.querySelector('main');
    const issuesLink = element.querySelector('a[href="/issues"]') as HTMLAnchorElement;
    expect(document.activeElement).not.toBe(main);

    issuesLink.focus();
    await router.navigateByUrl('/issues');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.activeElement).toBe(main);
  });

  it('redirects the root and routes creation and edit to the shared issue form', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/dashboard');
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Panel de control');
    expect(fixture.nativeElement.textContent).toContain('Estadísticas de incidencias');
    expect(fixture.nativeElement.textContent).not.toContain('todavía no está implementada');

    await router.navigateByUrl('/issues');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Incidencias');
    expect(fixture.nativeElement.textContent).toContain('Aún no hay incidencias');

    await router.navigateByUrl('/issues/new');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Nueva incidencia');
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('todavía no está implementada');

    await router.navigateByUrl('/issues/issue-1/edit');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      'Incidencia no encontrada',
    );
    expect(
      fixture.nativeElement.querySelector('main a[routerLink="/issues"]')?.textContent,
    ).toContain('Volver al listado');

    await router.navigateByUrl('/issues/issue-1');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      'Incidencia no encontrada',
    );
    expect(fixture.nativeElement.textContent).not.toContain('todavía no está implementada');
  });

  it('shows a saved creation in the issue list immediately', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/issues/new');
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const title = element.querySelector<HTMLInputElement>('#issue-title');
    const description = element.querySelector<HTMLTextAreaElement>('#issue-description');
    const category = element.querySelector<HTMLInputElement>('#issue-category');
    if (!title || !description || !category) throw new Error('Issue form was not rendered.');

    title.value = 'Created from the form';
    title.dispatchEvent(new Event('input'));
    description.value = 'A description long enough for a valid issue.';
    description.dispatchEvent(new Event('input'));
    category.value = 'Backend';
    category.dispatchEvent(new Event('input'));
    element
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/issues');
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Incidencias');
    expect(element.querySelector('main')?.textContent).toContain('Created from the form');
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it('shows a confirmed deletion and its saved outcome in the issue list', async () => {
    getItem.mockReturnValue(JSON.stringify([existingIssue]));
    const confirm = vi.fn(() => true);
    vi.stubGlobal('confirm', confirm);
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/issues/issue-1');
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(confirm).toHaveBeenCalledOnce();
    expect(router.url).toBe('/issues');
    expect(fixture.nativeElement.textContent).toContain('Incidencia eliminada y guardada.');
    expect(fixture.nativeElement.textContent).not.toContain(existingIssue.title);
  });

  it('updates issue details as the router reuses the page for different IDs', async () => {
    const secondIssue = { ...existingIssue, id: 'issue-2', title: 'Second issue' };
    getItem.mockReturnValue(JSON.stringify([existingIssue, secondIssue]));
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/issues/issue-1');
    await fixture.whenStable();
    fixture.detectChanges();
    const firstDetail = fixture.debugElement.query(
      By.directive(IssueDetailPageComponent),
    ).componentInstance;
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Existing issue');

    await router.navigateByUrl('/issues/issue-2');
    await fixture.whenStable();
    fixture.detectChanges();
    const secondDetail = fixture.debugElement.query(
      By.directive(IssueDetailPageComponent),
    ).componentInstance;
    expect(secondDetail).toBe(firstDetail);
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Second issue');

    await router.navigateByUrl('/issues/missing-issue');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.directive(IssueDetailPageComponent)).componentInstance,
    ).toBe(firstDetail);
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      'Incidencia no encontrada',
    );
    expect(fixture.nativeElement.querySelector('main a[href="/issues"]')?.textContent).toContain(
      'Volver al listado',
    );
  });

  it('shows a confirmed deletion as memory-only when storage rejects the write', async () => {
    getItem.mockReturnValue(JSON.stringify([existingIssue]));
    setItem.mockImplementation(() => {
      throw new Error('storage is full');
    });
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/issues/issue-1');
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/issues');
    expect(fixture.nativeElement.textContent).toContain(
      'La eliminación solo está en memoria y no se guardó.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Incidencia eliminada y guardada.');
    expect(fixture.nativeElement.textContent).not.toContain(existingIssue.title);
  });
});

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
