import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage)
  },
  {
    path: 'juego/:stageId',
    loadComponent: () => import('./pages/game/game.page').then((m) => m.GamePage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
