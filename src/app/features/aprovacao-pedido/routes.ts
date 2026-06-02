import { Routes } from '@angular/router';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { PedidosFabricaViewComponent } from '@/app/features/aprovacao-pedido/pages/pedidos-fabrica-view/pedidos-fabrica-view.component';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { CargoGuard } from '@/app/guard/Cargo.guard';
import { ContentLayoutComponent } from '@/app/shared/layouts/content-layout/content-layout.component';

export const APROVACAO_PEDIDO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => ContentLayoutComponent,
    canActivate: [AuthGuard, CargoGuard],
    children: [
      {
        path: '',
        canActivate: [AuthGuard, CargoGuard],
        loadComponent: () => PedidosFabricaViewComponent,
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
