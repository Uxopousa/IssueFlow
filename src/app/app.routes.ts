import { Routes } from '@angular/router';

import { RoutePlaceholderComponent } from './shared/components/route-placeholder.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    component: RoutePlaceholderComponent,
    data: { title: 'Panel de control' },
  },
  {
    path: 'issues',
    component: RoutePlaceholderComponent,
    data: { title: 'Incidencias' },
  },
  {
    path: 'issues/new',
    component: RoutePlaceholderComponent,
    data: { title: 'Nueva incidencia' },
  },
  {
    path: 'issues/:id/edit',
    component: RoutePlaceholderComponent,
    data: { title: 'Editar incidencia' },
  },
  {
    path: 'issues/:id',
    component: RoutePlaceholderComponent,
    data: { title: 'Detalle de incidencia' },
  },
];
