import { Routes } from '@angular/router';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { CargoGuard } from '@/app/guard/Cargo.guard';
import { ContentLayoutComponent } from '@/app/shared/layouts/content-layout/content-layout.component';
import { RelogioPontPageComponent } from '@/app/features/ponto/pages/relogio-pont-page/relogio-pont-page.component';
import { PresencaPageComponent } from '@/app/features/ponto/pages/presenca-page/presenca-page.component';
import { PONTO_ROLES } from '@/app/features/ponto/ponto-roles';

const FOLHA_HORA_EXTRA_ROUTES: Routes = [
  {
    path: 'he/categorias',
    canActivate: [CargoGuard],
    data: {
      roles: [SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.RH],
    },
    loadComponent: () => import('./pages/categorias-hora-extra-page/categorias-hora-extra-page.component')
      .then(m => m.CategoriasHoraExtraPageComponent),
  },
  {
    path: 'he/relatorio-recursos',
    loadComponent: () => import('./pages/relatorio-recursos-page/relatorio-recursos-page.component')
      .then(m => m.RelatorioRecursosPageComponent),
  },
  {
    path: 'he/kpi-motivos',
    canActivate: [CargoGuard],
    data: {
      roles: [SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.RH, SetUserCargoDTOCargoEnum.DIRETOR],
    },
    loadComponent: () => import('./pages/kpi-motivos-page/kpi-motivos-page.component')
      .then(m => m.KpiMotivosPageComponent),
  },
  {
    path: 'he/criar',
    loadComponent: () => import('./pages/folha-hora-extra-form-page/folha-hora-extra-form-page.component')
      .then(m => m.FolhaHoraExtraFormPageComponent),
  },
  {
    path: 'he/editar/:idFolha',
    loadComponent: () => import('./pages/folha-hora-extra-form-page/folha-hora-extra-form-page.component')
      .then(m => m.FolhaHoraExtraFormPageComponent),
  },
  {
    path: 'he/view/:idFolha',
    loadComponent: () => import('./pages/folha-hora-extra-detail-page/folha-hora-extra-detail-page.component')
      .then(m => m.FolhaHoraExtraDetailPageComponent),
  },
  {
    path: 'he',
    loadComponent: () => import('./pages/folha-hora-extra-list-page/folha-hora-extra-list-page.component')
      .then(m => m.FolhaHoraExtraListPageComponent),
  },
];

export const PONTO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => ContentLayoutComponent,
    canActivate: [AuthGuard, CargoGuard],
    data: {
      roles: PONTO_ROLES,
    },
    children: [
      ...FOLHA_HORA_EXTRA_ROUTES,
      {
        path: 'presenca',
        loadComponent: () => PresencaPageComponent,
      },
      {
        path: 'prefilter/:ccs',
        loadComponent: () => RelogioPontPageComponent,
      },
      {
        path: '',
        loadComponent: () => RelogioPontPageComponent,
        canActivate: [CargoGuard],
        data: {
          roles: PONTO_ROLES,
        },
      },
    ],
  },
  {
    canActivate: [AuthGuard, CargoGuard],
    path: ':ccs',
    loadComponent: () => ContentLayoutComponent,
    data: {
      roles: PONTO_ROLES,
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
          roles: PONTO_ROLES,
        },
      },
    ],
  },
];
