import { Routes } from '@angular/router';

import { IssueListPageComponent } from './features/issues/pages/issue-list-page/issue-list-page.component';
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
    component: IssueListPageComponent,
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
