import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/public/home/home').then((m) => m.Home),
    },
    {
        path: 'articulos',
        loadComponent: () => import('./features/public/article-list/article-list').then((m) => m.ArticleList),
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    },
    {
        path: '**',
        redirectTo: ''
    },
];
