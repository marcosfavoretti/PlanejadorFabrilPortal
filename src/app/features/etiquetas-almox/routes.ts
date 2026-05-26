import { Routes } from '@angular/router';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { CargoGuard } from '@/app/guard/Cargo.guard';
import { EtiquetasAlmoxPageComponent } from '@/app/features/etiquetas-almox/pages/etiquetas-almox-page/etiquetas-almox-page.component';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';

export const ETIQUETAS_ALMOX_ROUTES: Routes = [
  {
    path: '',
    canActivate: [AuthGuard, CargoGuard],
    loadComponent: () => EtiquetasAlmoxPageComponent,
    data: {
      roles: [SetUserCargoDTOCargoEnum.ALMOX, SetUserCargoDTOCargoEnum.ADMIN],
    }
  },
];
