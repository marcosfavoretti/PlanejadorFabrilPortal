import { Routes } from '@angular/router';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { ContentLayoutComponent } from '@/app/shared/layouts/content-layout/content-layout.component';
import { PerfilPageComponent } from './pages/perfil-page/perfil-page.component';

export const PERFIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => ContentLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => PerfilPageComponent,
      },
    ],
  },
];
