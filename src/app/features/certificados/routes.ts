import { Routes } from '@angular/router';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { CargoGuard } from '@/app/guard/Cargo.guard';
import { CertificadoCaterpillarPageComponent } from '@/app/features/certificados/pages/certificado-caterpillar-page/certificado-caterpillar-page.component';

export const CERTIFICADOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => CertificadoCaterpillarPageComponent,
    canActivate: [AuthGuard, CargoGuard],
  },
];
