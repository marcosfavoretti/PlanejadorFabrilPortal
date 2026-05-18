import { Routes } from '@angular/router';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { LIDERES_ROLES } from '@/app/core/auth/role-groups';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { CargoGuard } from '@/app/guard/Cargo.guard';
import { ContentLayoutComponent } from '@/app/shared/layouts/content-layout/content-layout.component';
import { RelogioPontPageComponent } from '@/app/features/ponto/pages/relogio-pont-page/relogio-pont-page.component';

export const PONTO_ROUTES: Routes = [
  {
    path: ':ccs',
    canActivate: [AuthGuard, CargoGuard],
    loadComponent: () => ContentLayoutComponent,
    children: [
      {
        path: 'prefilter/:ccs',
        loadComponent: () => RelogioPontPageComponent,
      },
      {
        path: '',
        loadComponent: () => RelogioPontPageComponent,
        canActivate: [CargoGuard],
        data: {
          roles: [SetUserCargoDTOCargoEnum.ADMIN],
        },
      },
    ],
  },
  {
    path: '',
    loadComponent: () => ContentLayoutComponent,
    canActivate: [AuthGuard, CargoGuard],
    data: {
      roles: [
        SetUserCargoDTOCargoEnum.ADMIN,
        ...LIDERES_ROLES,
      ],
    },
    children: [
      {
        path: 'prefilter/:ccs',
        loadComponent: () => RelogioPontPageComponent,
      },
      {
        path: '',
        loadComponent: () => RelogioPontPageComponent,
        canActivate: [CargoGuard],
        data: {
          roles: [SetUserCargoDTOCargoEnum.ADMIN],
        },
      },
    ],
  },
];
