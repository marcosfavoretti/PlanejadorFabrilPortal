import { Routes } from '@angular/router';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { CargoGuard } from '@/app/guard/Cargo.guard';

export const PORTARIA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@/app/features/portaria/pages/portaria-control-page/portaria-control-page.component').then(
        (m) => m.PortariaControlPageComponent,
      ),
    canActivate: [AuthGuard, CargoGuard],
    data: {
      roles: [SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.DIRETOR],
    },
  },
];
