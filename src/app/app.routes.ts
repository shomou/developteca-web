import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'admin/dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'admin/articulos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/article-manage/article-manage').then((m) => m.ArticleManage),
  },
  {
    path: 'admin/articulos/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/article-editor/article-editor').then((m) => m.ArticleEditor),
  },
  {
    path: 'admin/articulos/editar/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/article-editor/article-editor').then((m) => m.ArticleEditor),
  },
  {
    path: 'articulos/:slug',
    loadComponent: () =>
      import('./features/public/article-detail/article-detail').then((m) => m.ArticleDetail),
  },
  {
    path: '',
    loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
  },
  {
    path: 'articulos',
    loadComponent: () =>
      import('./features/public/article-list/article-list').then((m) => m.ArticleList),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
