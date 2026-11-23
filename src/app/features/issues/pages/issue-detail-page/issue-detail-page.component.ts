import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { Issue, IssuePriority, IssueStatus } from '../../../../core/models/issue.model';
import { IssueOperationError, IssueService } from '../../../../core/services/issue.service';

type Feedback = {
  readonly kind: 'error';
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
  selector: 'app-issue-detail-page',
  imports: [RouterLink],
  templateUrl: './issue-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly issueService = inject(IssueService);
  protected readonly issueId = toSignal(
    this.route.paramMap.pipe(map((paramMap) => paramMap.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );
  protected readonly issue = computed(() =>
    this.issueId()
      ? this.issueService.issues().find((item) => item.id === this.issueId())
      : undefined,
  );
  protected readonly feedback = signal<Feedback | null>(null);

  protected statusLabel(status: IssueStatus): string {
    return STATUS_LABELS[status];
  }

  protected priorityLabel(priority: IssuePriority): string {
    return PRIORITY_LABELS[priority];
  }

  protected formatDate(value: string): string {
    return DATE_FORMATTER.format(new Date(value));
  }

  protected deleteIssue(issue: Readonly<Issue>): void {
    if (!window.confirm(`¿Quieres eliminar la incidencia «${issue.title}»?`)) return;

    const result = this.issueService.delete(issue.id);
    if (result.status === 'rejected') {
      this.feedback.set({ kind: 'error', message: operationErrorMessage(result.error) });
      return;
    }

    void this.router.navigateByUrl('/issues', {
      state: { issueDeleteStatus: result.status },
    });
  }
}

function operationErrorMessage(error: IssueOperationError): string {
  if (error.code === 'validation') return 'No se pudo eliminar la incidencia.';

  switch (error.code) {
    case 'not-found':
      return 'La incidencia ya no está disponible. Vuelve al listado.';
    case 'generation-failed':
      return 'No se pudo preparar la operación. Inténtalo de nuevo.';
    case 'unread-storage':
      return 'No se puede guardar sin confirmar primero el almacenamiento no leído.';
    case 'no-pending-changes':
      return 'No hay cambios pendientes para guardar.';
  }
  return 'No se pudo completar la operación.';
}
