import { Routes } from '@angular/router';

import { DashboardPageComponent } from './features/dashboard/dashboard-page/dashboard-page.component';
import { IssueListPageComponent } from './features/issues/pages/issue-list-page/issue-list-page.component';
import { RoutePlaceholderComponent } from './shared/components/route-placeholder.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
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
