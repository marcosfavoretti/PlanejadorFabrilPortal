import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/pages/home-page/home-page.component';
import { WelcomePageComponent } from './features/home/pages/welcome-page/welcome-page.component';
import { AUTH_ROUTES } from '@/app/core/auth/auth.routes';
import { AuthGuard } from '@/app/guard/Auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full',
    },
    {
        path: 'app',
        redirectTo: 'welcome'
    },
    {
        path: 'welcome',
        loadComponent: () => HomePageComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '', loadComponent: () => WelcomePageComponent
            }
        ]
    },
    {
        path: 'pb',
        loadChildren: () => import('./features/pbindex/routes').then((m) => m.PBINDEX_ROUTES),
    },
    {
        path: 'planejamentos',
        loadChildren: () => import('./features/planejamento/routes').then((m) => m.PLANEJAMENTO_ROUTES),
    },
    {
        path: 'certificados',
        loadChildren: () => import('./features/certificados/routes').then((m) => m.CERTIFICADOS_ROUTES),
    },
    {
        path: 'ponto',
        loadChildren: () => import('./features/ponto/routes').then((m) => m.PONTO_ROUTES),
    },
    {
        path: 'wifi',
        loadChildren: () => import('./features/wifi/routes').then((m) => m.WIFI_ROUTES),
    },
    {
        path: 'buffer',
        loadChildren: () => import('./features/buffer/routes').then((m) => m.BUFFER_ROUTES),
    },
    {
        path: 'portaria',
        loadChildren: () => import('./features/portaria/routes').then((m) => m.PORTARIA_ROUTES),
    },
    {
        path: 'estrutura',
        loadChildren: () => import('./features/estrutura/routes').then((m) => m.ESTRUTURA_ROUTES),
    },
    ...AUTH_ROUTES,
];
