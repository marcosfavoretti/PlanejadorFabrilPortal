import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { FabricaPageComponent } from './pages/fabrica-page/fabrica-page.component';
import { LoginScreenComponent } from './pages/login-screen/login-screen.component';
import { RegisterScreenComponent } from './pages/register-screen/register-screen.component';
import { AuthGuard } from './guard/AuthGuard';
import { ItemPaginaComponent } from './pages/item-pagina/item-pagina.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'app',
        pathMatch: 'full',
    },
    {
        path: 'app',
        loadComponent: () => HomePageComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'register',
        loadComponent: () => RegisterScreenComponent
    },
    {
        path: 'login',
        loadComponent: () => LoginScreenComponent
    },
    {
        path: 'item',
        loadComponent: () => ItemPaginaComponent,
        canActivate: []
    },
    {
        path: 'fabrica/:fabricaId',
        loadComponent: () => FabricaPageComponent,
        canActivate: [AuthGuard]
    }
];
