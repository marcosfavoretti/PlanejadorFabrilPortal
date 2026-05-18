import { Routes } from '@angular/router';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { CargoGuard } from '@/app/guard/Cargo.guard';
import { ContagemBufferPageComponent } from './pages/contagem-buffer-page/contagem-buffer-page.component';

export const BUFFER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => ContagemBufferPageComponent,
    canActivate: [AuthGuard, CargoGuard],
    data: {
      roles: [SetUserCargoDTOCargoEnum.PCP, SetUserCargoDTOCargoEnum.ADMIN],
    },
  },
];
