import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Issue, IssueStatus } from '../../../core/models/issue.model';
import { ISSUE_STORAGE_ACCESS } from '../../../core/services/issue-storage.service';
import {
  ISSUE_CLOCK,
  ISSUE_ID_GENERATOR,
  IssueService,
} from '../../../core/services/issue.service';
import { DashboardPageComponent } from './dashboard-page.component';

function issue(id: string, status: IssueStatus = 'open'): Issue {
  return {
    id,
    title: `Issue ${id}`,
    description: 'A sufficiently detailed issue description',
    category: 'General',
    priority: 'medium',
    status,
    createdAt: '2026-11-20T10:00:00.000Z',
    updatedAt: '2026-11-20T10:00:00.000Z',
  };
}

describe('DashboardPageComponent', () => {
  let getItem: ReturnType<typeof vi.fn<() => string | null>>;
  let setItem: ReturnType<typeof vi.fn<(key: string, value: string) => void>>;

  beforeEach(async () => {
    getItem = vi.fn(() => null);
    setItem = vi.fn();
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ISSUE_STORAGE_ACCESS,
          useValue: () => ({ getItem, setItem }),
        },
        { provide: ISSUE_ID_GENERATOR, useValue: () => 'new-id' },
        { provide: ISSUE_CLOCK, useValue: () => '2026-11-20T11:00:00.000Z' },
      ],
    }).compileComponents();
  });

  function createPage(): {
    fixture: ComponentFixture<DashboardPageComponent>;
    service: IssueService;
  } {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    const service = TestBed.inject(IssueService);
    fixture.detectChanges();
    return { fixture, service };
  }

  function metric(element: HTMLElement, label: string): string | undefined {
    const labelElement = Array.from(element.querySelectorAll('dt')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    return labelElement?.nextElementSibling?.textContent?.trim();
  }

  it('renders global statistics and ignores active list filters', () => {
    getItem.mockReturnValue(
      JSON.stringify([issue('one'), issue('two'), issue('three', 'in-progress')]),
    );
    const { fixture, service } = createPage();

    expect(metric(fixture.nativeElement, 'Total')).toBe('3');
    expect(metric(fixture.nativeElement, 'Abiertas')).toBe('2');
    expect(metric(fixture.nativeElement, 'En progreso')).toBe('1');
    expect(metric(fixture.nativeElement, 'Resueltas')).toBe('0');

    service.setSearchQuery('no matching issue');
    service.setStatusFilter('resolved');
    service.setPriorityFilter('high');
    fixture.detectChanges();

    expect(metric(fixture.nativeElement, 'Total')).toBe('3');
    expect(metric(fixture.nativeElement, 'Abiertas')).toBe('2');
    expect(metric(fixture.nativeElement, 'En progreso')).toBe('1');
    expect(metric(fixture.nativeElement, 'Resueltas')).toBe('0');
  });

  it('updates displayed counts after issue operations', () => {
    getItem.mockReturnValue(JSON.stringify([issue('one')]));
    const { fixture, service } = createPage();

    service.create({
      title: 'New issue',
      description: 'A sufficiently detailed issue description',
      category: 'General',
      priority: 'high',
      status: 'in-progress',
    });
    fixture.detectChanges();
    expect(metric(fixture.nativeElement, 'Total')).toBe('2');
    expect(metric(fixture.nativeElement, 'En progreso')).toBe('1');

    service.changeStatus('new-id', 'resolved');
    fixture.detectChanges();
    expect(metric(fixture.nativeElement, 'Resueltas')).toBe('1');
  });

  it('shows zero statistics and a creation link for a valid empty collection', () => {
    const { fixture } = createPage();
    const element = fixture.nativeElement as HTMLElement;

    expect(metric(element, 'Total')).toBe('0');
    expect(metric(element, 'Abiertas')).toBe('0');
    expect(metric(element, 'En progreso')).toBe('0');
    expect(metric(element, 'Resueltas')).toBe('0');
    expect(element.textContent).toContain('Aún no hay incidencias');
    expect(element.querySelector('a[href="/issues/new"]')?.textContent?.trim()).toBe(
      'Crear la primera incidencia',
    );
  });

  it('does not present zero statistics as an empty collection after load failure', () => {
    getItem.mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    const { fixture } = createPage();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo confirmar la información guardada',
    );
    expect(element.querySelector('dl')).toBeNull();
    expect(element.textContent).not.toContain('Aún no hay incidencias');
    expect(element.querySelector('a[href="/issues"]')?.textContent?.trim()).toBe(
      'Ver incidencias disponibles',
    );
  });

  it('shows memory-only counts and warns when persistence fails', () => {
    setItem.mockImplementation(() => {
      throw new Error('storage full');
    });
    const { fixture, service } = createPage();

    service.create({
      title: 'New issue',
      description: 'A sufficiently detailed issue description',
      category: 'General',
      priority: 'high',
      status: 'resolved',
    });
    fixture.detectChanges();

    expect(metric(fixture.nativeElement, 'Total')).toBe('1');
    expect(metric(fixture.nativeElement, 'Resueltas')).toBe('1');
    expect(fixture.nativeElement.textContent).toContain(
      'Las cifras reflejan los datos actuales en memoria',
    );
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
  });
});
