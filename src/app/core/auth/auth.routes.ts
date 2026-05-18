import { Routes } from '@angular/router';
import { RegisterScreenComponent } from './pages/register-screen/register-screen.component';
import { LoginScreenComponent } from './pages/login-screen/login-screen.component';
import { RegisterTokenGuard } from '@/app/guard/RegisterToken.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'register',
    loadComponent: () => RegisterScreenComponent,
  },
  {
    path: 'register/:token',
    canActivate: [RegisterTokenGuard],
    loadComponent: () => RegisterScreenComponent,
  },
  {
    path: 'login',
    loadComponent: () => LoginScreenComponent,
  },
];
