import { Routes } from '@angular/router';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { PbIndexPageComponent } from '@/app/features/pbindex/pages/pb-index-page/pb-index-page.component';

export const PBINDEX_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => PbIndexPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':grafico',
    loadComponent: () => PbIndexPageComponent,
    canActivate: [AuthGuard],
  },
];
