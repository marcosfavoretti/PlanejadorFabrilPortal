import { Routes } from '@angular/router';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { CargoGuard } from '@/app/guard/Cargo.guard';
import { ContentLayoutComponent } from '@/app/shared/layouts/content-layout/content-layout.component';
import { FabricasParaAvaliacaoViewComponent } from '@/app/features/planejamento/pages/fabricas-para-avaliacao-view/fabricas-para-avaliacao-view.component';
import { FabricaPageComponent } from '@/app/features/planejamento/pages/fabrica-page/fabrica-page.component';
import { FabricaPageReadOnlyComponent } from '@/app/features/planejamento/pages/fabrica-page-read-only/fabrica-page-read-only.component';
import { FabricaPrincipalViewComponent } from '@/app/features/planejamento/pages/fabrica-principal-view/fabrica-principal-view.component';
import { ItemPaginaComponent } from '@/app/features/planejamento/pages/item-pagina/item-pagina.component';
import { MinhasFabricasPageComponent } from '@/app/features/planejamento/pages/minhas-fabricas-page/minhas-fabricas-page.component';
import { PedidosFabricaViewComponent } from '@/app/features/planejamento/pages/pedidos-fabrica-view/pedidos-fabrica-view.component';

export const PLANEJAMENTO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => ContentLayoutComponent,
    canActivate: [AuthGuard, CargoGuard],
    children: [
      {
        path: '',
        redirectTo: 'fabricaPrincipal',
        pathMatch: 'full',
      },
      {
        path: 'fabricaPrincipal',
        canActivate: [AuthGuard, CargoGuard],
        loadComponent: () => FabricaPrincipalViewComponent,
        data: {
          roles: [
            SetUserCargoDTOCargoEnum.CATERPILLAR_USER,
            SetUserCargoDTOCargoEnum.ADMIN,
            SetUserCargoDTOCargoEnum.PCP,
            SetUserCargoDTOCargoEnum.USER,
          ],
        },
      },
      {
        path: 'minhas-fabricas',
        canActivate: [AuthGuard, CargoGuard],
        loadComponent: () => MinhasFabricasPageComponent,
        data: {
          roles: [
            SetUserCargoDTOCargoEnum.CATERPILLAR_USER,
            SetUserCargoDTOCargoEnum.ADMIN,
            SetUserCargoDTOCargoEnum.PCP,
            SetUserCargoDTOCargoEnum.USER,
          ],
        },
      },
      {
        path: 'fabrica/:fabricaId',
        canActivate: [AuthGuard, CargoGuard],
        loadComponent: () => FabricaPageComponent,
        data: {
          roles: [
            SetUserCargoDTOCargoEnum.ADMIN,
            SetUserCargoDTOCargoEnum.PCP,
            SetUserCargoDTOCargoEnum.USER,
          ],
        },
      },
      {
        path: 'RO/fabrica/:fabricaId',
        canActivate: [AuthGuard, CargoGuard],
        loadComponent: () => FabricaPageReadOnlyComponent,
        data: {
          roles: [
            SetUserCargoDTOCargoEnum.ADMIN,
            SetUserCargoDTOCargoEnum.PCP,
            SetUserCargoDTOCargoEnum.USER,
          ],
        },
      },
      {
        path: 'pedidos',
        canActivate: [AuthGuard, CargoGuard],
        loadComponent: () => PedidosFabricaViewComponent,
        data: {
          roles: [
            SetUserCargoDTOCargoEnum.ADMIN,
            SetUserCargoDTOCargoEnum.PCP,
          ],
        },
      },
      {
        path: 'fabricaAvaliacao',
        canActivate: [AuthGuard, CargoGuard],
        loadComponent: () => FabricasParaAvaliacaoViewComponent,
        data: {
          roles: [
            SetUserCargoDTOCargoEnum.ADMIN,
            SetUserCargoDTOCargoEnum.PCP,
          ],
        },
      },
      {
        path: 'capabilidades',
        canActivate: [AuthGuard, CargoGuard],
        loadComponent: () => ItemPaginaComponent,
        data: {
          roles: [
            SetUserCargoDTOCargoEnum.ADMIN,
            SetUserCargoDTOCargoEnum.PCP,
          ],
        },
      },
    ],
  },
];
