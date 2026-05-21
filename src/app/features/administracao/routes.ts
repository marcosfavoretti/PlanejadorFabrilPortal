import { Routes } from '@angular/router';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { CargoGuard } from '@/app/guard/Cargo.guard';
import { ContentLayoutComponent } from '@/app/shared/layouts/content-layout/content-layout.component';
import { SystemSettingsPageComponent } from './pages/system-settings-page/system-settings-page.component';

export const ADMINISTRACAO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => ContentLayoutComponent,
    canActivate: [AuthGuard, CargoGuard],
    data: {
      roles: [SetUserCargoDTOCargoEnum.ADMIN],
    },
    children: [
      {
        path: '',
        loadComponent: () => SystemSettingsPageComponent,
      },
    ],
  },
];
