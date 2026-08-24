import { Routes } from '@angular/router';
import { AuthGuard } from '@/app/guard/Auth.guard';

export const MOBILE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'etiquetapdi',
  },
  {
    path: 'etiquetapdi',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('@/app/features/mobile/pages/mobile-page/mobile-page.component').then(
        (module) => module.MobilePageComponent,
      ),
  },
  {
    path: 'historico',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('@/app/features/mobile/pages/mobile-history-page/mobile-history-page.component').then(
        (module) => module.MobileHistoryPageComponent,
      ),
  },
  {
    path: 'historico/ficha/:id',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('@/app/features/mobile/pages/mobile-history-detail-page/mobile-history-detail-page.component').then(
        (module) => module.MobileHistoryDetailPageComponent,
      ),
  },
];
