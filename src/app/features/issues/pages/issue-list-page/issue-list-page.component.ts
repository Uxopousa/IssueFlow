import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { isIssueStatus } from '../../../../core/models/issue-validation';
import { Issue, IssuePriority, IssueStatus } from '../../../../core/models/issue.model';
import {
  IssueOperationError,
  IssueOperationResult,
  IssuePersistenceError,
  IssueService,
} from '../../../../core/services/issue.service';
import { IssueStorageError } from '../../../../core/services/issue-storage.service';

type Feedback = {
  readonly kind: 'success' | 'warning' | 'error';
  readonly message: string;
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Abierta',
  'in-progress': 'En progreso',
  resolved: 'Resuelta',
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

@Component({
  selector: 'app-issue-list-page',
  imports: [RouterLink],
  templateUrl: './issue-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueListPageComponent {
  private readonly host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  protected readonly issueService = inject(IssueService);
  protected readonly hasActiveFilters = computed(() => {
    const filters = this.issueService.filters();
    return filters.query.trim().length > 0 || filters.status !== null || filters.priority !== null;
  });
  protected readonly statuses: readonly IssueStatus[] = ['open', 'in-progress', 'resolved'];
  protected readonly priorities: readonly IssuePriority[] = ['low', 'medium', 'high'];
  protected readonly feedback = signal<Feedback | null>(
    deleteFeedback(this.router.currentNavigation()?.extras.state),
  );

  protected statusLabel(status: IssueStatus): string {
    return STATUS_LABELS[status];
  }

  protected priorityLabel(priority: IssuePriority): string {
    return PRIORITY_LABELS[priority];
  }

  protected formatDate(value: string): string {
    return DATE_FORMATTER.format(new Date(value));
  }

  protected updateSearchQuery(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    this.issueService.setSearchQuery(input.value);
  }

  protected updateStatusFilter(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement;
    const status = select.value;
    if (status === '' || isIssueStatus(status)) {
      this.issueService.setStatusFilter(status || null);
    }
  }

  protected updatePriorityFilter(event: Event): void {
    const select = event.currentTarget as HTMLSelectElement;
    const priority = select.value;
    if (priority === '' || priority === 'low' || priority === 'medium' || priority === 'high') {
      this.issueService.setPriorityFilter(priority || null);
    }
  }

  protected clearFilters(): void {
    this.issueService.setSearchQuery('');
    this.issueService.setStatusFilter(null);
    this.issueService.setPriorityFilter(null);
  }

  protected changeStatus(issue: Readonly<Issue>, event: Event): void {
    const select = event.currentTarget as HTMLSelectElement;
    const status = select.value;
    if (!isIssueStatus(status)) return;

    const result = this.issueService.changeStatus(issue.id, status);
    this.reportResult(result, 'change-status');
    if (result.status === 'rejected') select.value = issue.status;
  }

  protected deleteIssue(issue: Readonly<Issue>): void {
    const visibleIssues = this.issueService.filteredIssues();
    const issueIndex = visibleIssues.findIndex((visibleIssue) => visibleIssue.id === issue.id);
    const nextVisibleIssue = visibleIssues[issueIndex + 1] ?? visibleIssues[issueIndex - 1];
    if (!window.confirm(`¿Quieres eliminar la incidencia «${issue.title}»?`)) return;

    const result = this.issueService.delete(issue.id);
    this.reportResult(result, 'delete');
    if (result.status === 'rejected') return;

    afterNextRender(
      () => {
        if (nextVisibleIssue) {
          const issueLinks = this.host.querySelectorAll<HTMLElement>('[data-issue-focus]');
          Array.from(issueLinks)
            .find((link) => link.dataset['issueId'] === nextVisibleIssue.id)
            ?.focus();
          return;
        }

        const focusTarget =
          this.issueService.issues().length === 0
            ? '[data-list-focus="create"]'
            : '[data-list-focus="clear"]';
        this.host.querySelector<HTMLElement>(focusTarget)?.focus();
      },
      { injector: this.injector },
    );
  }

  protected persistenceErrorMessage(error: IssuePersistenceError): string {
    const prefix = error.phase === 'load' ? 'No se pudo cargar' : 'No se pudo guardar';
    return `${prefix} la información de incidencias. ${storageErrorMessage(error.code)}`;
  }

  private reportResult(
    result: IssueOperationResult<Readonly<Issue>>,
    operation: 'change-status' | 'delete',
  ): void {
    if (result.status === 'saved') {
      this.feedback.set({
        kind: 'success',
        message:
          operation === 'delete'
            ? 'Incidencia eliminada y guardada.'
            : 'Estado actualizado y guardado.',
      });
      return;
    }

    if (result.status === 'memory-only') {
      const action = operation === 'delete' ? 'La eliminación' : 'El cambio de estado';
      this.feedback.set({
        kind: 'warning',
        message: `${action} solo está en memoria y no se guardó. ${storageErrorMessage(result.error)}`,
      });
      return;
    }

    this.feedback.set({ kind: 'error', message: operationErrorMessage(result.error) });
  }
}

function storageErrorMessage(error: IssueStorageError): string {
  switch (error) {
    case 'storage-unavailable':
      return 'El almacenamiento local no está disponible.';
    case 'read-failed':
      return 'No se pudieron leer los datos guardados.';
    case 'invalid-json':
      return 'Los datos guardados no contienen JSON válido.';
    case 'invalid-data':
      return 'Los datos guardados tienen un formato no válido.';
    case 'serialization-failed':
      return 'No se pudieron preparar los datos para guardarlos.';
    case 'write-failed':
      return 'El almacenamiento local rechazó la escritura.';
  }
  return 'Se produjo un error de almacenamiento.';
}

function operationErrorMessage(error: IssueOperationError): string {
  if (error.code === 'validation') return 'No se pudo completar la operación por datos no válidos.';

  switch (error.code) {
    case 'not-found':
      return 'La incidencia ya no está disponible. Actualiza la lista.';
    case 'generation-failed':
      return 'No se pudo preparar la operación. Inténtalo de nuevo.';
    case 'unread-storage':
      return 'No se puede guardar sin confirmar primero el almacenamiento no leído.';
    case 'no-pending-changes':
      return 'No hay cambios pendientes para guardar.';
  }
  return 'No se pudo completar la operación.';
}

function deleteFeedback(state: Record<string, unknown> | undefined): Feedback | null {
  const status = state?.['issueDeleteStatus'];
  if (status === 'saved') {
    return { kind: 'success', message: 'Incidencia eliminada y guardada.' };
  }
  if (status === 'memory-only') {
    return {
      kind: 'warning',
      message: 'La eliminación solo está en memoria y no se guardó.',
    };
  }
  return null;
}
