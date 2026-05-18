import { Routes } from '@angular/router';
import { WifiConfirmationPageComponent } from '@/app/features/wifi/pages/wifi-confirmation-page/wifi-confirmation-page.component';
import { WifiSolicitationPageComponent } from '@/app/features/wifi/pages/wifi-solicitation-page/wifi-solicitation-page.component';

export const WIFI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => WifiSolicitationPageComponent,
  },
  {
    path: ':id',
    loadComponent: () => WifiConfirmationPageComponent,
  },
];
