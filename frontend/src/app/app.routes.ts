import { Routes } from '@angular/router';

import { DashboardPageComponent } from './features/dashboard/dashboard-page/dashboard-page.component';
import { IssueDetailPageComponent } from './features/issues/pages/issue-detail-page/issue-detail-page.component';
import { IssueFormPageComponent } from './features/issues/pages/issue-form-page/issue-form-page.component';
import { IssueListPageComponent } from './features/issues/pages/issue-list-page/issue-list-page.component';

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
    component: IssueFormPageComponent,
  },
  {
    path: 'issues/:id/edit',
    component: IssueFormPageComponent,
  },
  {
    path: 'issues/:id',
    component: IssueDetailPageComponent,
  },
];
