import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { vi } from 'vitest';

import { ISSUE_STORAGE_ACCESS } from './core/services/issue-storage.service';
import { App } from './app';
import { appConfig } from './app.config';

describe('App', () => {
  const getItem = vi.fn(() => null);

  beforeEach(async () => {
    getItem.mockClear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        ...appConfig.providers,
        {
          provide: ISSUE_STORAGE_ACCESS,
          useValue: () => ({ getItem, setItem: vi.fn() }),
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
            useValue: () => ({ getItem, setItem: vi.fn() }),
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

  it('redirects the root and exposes structural placeholders for each MVP route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/dashboard');
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Panel de control');

    const routes = [
      ['/issues', 'Incidencias'],
      ['/issues/new', 'Nueva incidencia'],
      ['/issues/issue-1', 'Detalle de incidencia'],
      ['/issues/issue-1/edit', 'Editar incidencia'],
    ] as const;

    for (const [path, title] of routes) {
      await router.navigateByUrl(path);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(title);
      expect(fixture.nativeElement.textContent).toContain('todavía no está implementada');
    }
  });
});
