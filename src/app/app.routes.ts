import { Routes } from '@angular/router';

import { adminGuard, authGuard, guestGuard } from './core/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/register.page').then((m) => m.RegisterPage)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage)
  },
  {
    path: 'ranking',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/ranking/ranking.page').then((m) => m.RankingPage)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin.page').then((m) => m.AdminPage),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'users',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin/users/admin-users-list.page').then((m) => m.AdminUsersListPage),
      },
      {
        path: 'users/new',
        loadComponent: () =>
          import('./pages/admin/users/admin-user-create.page').then((m) => m.AdminUserCreatePage),
      },
      {
        path: 'users/:id/edit',
        loadComponent: () =>
          import('./pages/admin/users/admin-user-edit.page').then((m) => m.AdminUserEditPage),
      },
      {
        path: 'ranking',
        loadComponent: () =>
          import('./pages/admin/ranking/admin-ranking-list.page').then((m) => m.AdminRankingListPage),
      },
      {
        path: 'puntos',
        loadComponent: () =>
          import('./pages/admin/scores/admin-scores-list.page').then((m) => m.AdminScoresListPage),
      },
      {
        path: 'puntos/new',
        loadComponent: () =>
          import('./pages/admin/scores/admin-score-create.page').then((m) => m.AdminScoreCreatePage),
      },
      {
        path: 'puntos/:id/edit',
        loadComponent: () =>
          import('./pages/admin/scores/admin-score-edit.page').then((m) => m.AdminScoreEditPage),
      },
      {
        path: 'escuelas',
        loadComponent: () =>
          import('./pages/admin/schools/admin-schools-list.page').then((m) => m.AdminSchoolsListPage),
      },
      {
        path: 'escuelas/new',
        loadComponent: () =>
          import('./pages/admin/schools/admin-school-create.page').then((m) => m.AdminSchoolCreatePage),
      },
      {
        path: 'escuelas/:id/edit',
        loadComponent: () =>
          import('./pages/admin/schools/admin-school-edit.page').then((m) => m.AdminSchoolEditPage),
      },
    ],
  },
  {
    path: 'juego/:stageId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/game/game.page').then((m) => m.GamePage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
