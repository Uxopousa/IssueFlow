import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Issue, IssueInput, IssuePriority, IssueStatus } from '../../../../core/models/issue.model';
import {
  IssueOperationError,
  IssueOperationResult,
  IssueService,
} from '../../../../core/services/issue.service';
import { IssueStorageError } from '../../../../core/services/issue-storage.service';

type IssueFormControls = {
  title: FormControl<string>;
  description: FormControl<string>;
  category: FormControl<string>;
  priority: FormControl<IssuePriority>;
  status: FormControl<IssueStatus>;
};

type TextField = 'title' | 'description' | 'category';

type Feedback = {
  readonly kind: 'success' | 'warning' | 'error';
  readonly message: string;
};

const DEFAULT_INPUT: IssueInput = {
  title: '',
  description: '',
  category: '',
  priority: 'medium',
  status: 'open',
};

const TEXT_FIELD_LIMITS: Record<TextField, { readonly min: number; readonly max: number }> = {
  title: { min: 3, max: 100 },
  description: { min: 10, max: 1000 },
  category: { min: 2, max: 50 },
};

@Component({
  selector: 'app-issue-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './issue-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssueFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly issueService = inject(IssueService);
  protected readonly issueId = this.route.snapshot.paramMap.get('id');
  protected readonly issue = this.issueId ? this.issueService.getById(this.issueId) : undefined;
  protected readonly isMissingIssue = this.issueId !== null && !this.issue;
  protected readonly isEditing = this.issueId !== null;
  protected readonly submitted = signal(false);
  protected readonly feedback = signal<Feedback | null>(null);
  protected readonly form = new FormGroup<IssueFormControls>(
    createControls(this.issue ?? DEFAULT_INPUT),
  );

  protected get pageTitle(): string {
    return this.isEditing ? 'Editar incidencia' : 'Nueva incidencia';
  }

  protected hasError(field: TextField | 'priority' | 'status'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }

  protected fieldErrorMessage(field: TextField): string {
    const errors = this.form.controls[field].errors;
    const limits = TEXT_FIELD_LIMITS[field];

    if (errors?.['required']) return 'Este campo es obligatorio.';
    if (errors?.['minlength']) {
      return `Escribe al menos ${limits.min} caracteres, sin contar espacios exteriores.`;
    }
    if (errors?.['maxlength']) {
      return `No superes los ${limits.max} caracteres, sin contar espacios exteriores.`;
    }
    return 'Revisa el valor de este campo.';
  }

  protected submit(): void {
    this.submitted.set(true);
    this.feedback.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isMissingIssue) {
      return;
    }

    const input = this.form.getRawValue();
    const result = this.issueId
      ? this.issueService.update(this.issueId, input)
      : this.issueService.create(input);
    this.reportResult(result);
  }

  private reportResult(result: IssueOperationResult<Readonly<Issue>>): void {
    if (result.status === 'saved') {
      if (!this.isEditing) {
        void this.router.navigateByUrl('/issues');
        return;
      }

      this.feedback.set({
        kind: 'success',
        message: 'Los cambios se guardaron correctamente.',
      });
      return;
    }

    if (result.status === 'memory-only') {
      this.feedback.set({
        kind: 'warning',
        message: `${this.isEditing ? 'Los cambios' : 'La incidencia'} permanecen solo en memoria; no se guardaron. ${storageErrorMessage(result.error)}`,
      });
      return;
    }

    this.feedback.set({ kind: 'error', message: operationErrorMessage(result.error) });
  }
}

function createControls(issue: IssueInput): IssueFormControls {
  return {
    title: new FormControl(issue.title, {
      nonNullable: true,
      validators: [trimmedLengthValidator(3, 100)],
    }),
    description: new FormControl(issue.description, {
      nonNullable: true,
      validators: [trimmedLengthValidator(10, 1000)],
    }),
    category: new FormControl(issue.category, {
      nonNullable: true,
      validators: [trimmedLengthValidator(2, 50)],
    }),
    priority: new FormControl(issue.priority, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl(issue.status, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  };
}

function trimmedLengthValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (typeof control.value !== 'string') return { required: true };

    const length = control.value.trim().length;
    if (length === 0) return { required: true };
    if (length < min) return { minlength: { requiredLength: min, actualLength: length } };
    if (length > max) return { maxlength: { requiredLength: max, actualLength: length } };
    return null;
  };
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
  if (error.code === 'validation') return 'No se pudo guardar: los datos no son válidos.';

  switch (error.code) {
    case 'not-found':
      return 'La incidencia ya no está disponible. Vuelve al listado.';
    case 'generation-failed':
      return 'No se pudo preparar la incidencia. Inténtalo de nuevo.';
    case 'unread-storage':
      return 'No se puede guardar sin confirmar primero el almacenamiento no leído.';
    case 'no-pending-changes':
      return 'No hay cambios pendientes para guardar.';
  }
  return 'No se pudo completar la operación.';
}
