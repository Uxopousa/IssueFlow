import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-route-placeholder',
  standalone: true,
  template: `
    <section aria-labelledby="page-title" class="max-w-2xl">
      <p class="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-800">
        MVP en desarrollo
      </p>
      <h1 id="page-title" class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {{ title() }}
      </h1>
      <p class="mt-4 max-w-prose text-base leading-7 text-slate-700">
        Esta sección está prevista para el MVP y todavía no está implementada.
      </p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutePlaceholderComponent {
  readonly title = input.required<string>();
}
