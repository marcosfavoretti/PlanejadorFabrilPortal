import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { FabricaPageComponent } from './pages/fabrica-page/fabrica-page.component';
import { LoginScreenComponent } from './pages/login-screen/login-screen.component';
import { RegisterScreenComponent } from './pages/register-screen/register-screen.component';
import { AuthGuard } from './guard/Auth.guard';
import { ItemPaginaComponent } from './pages/item-pagina/item-pagina.component';
import { FabricaPrincipalViewComponent } from './widgets/fabrica-principal-view/fabrica-principal-view.component';
import { PedidosFabricaViewComponent } from './widgets/pedidos-fabrica-view/pedidos-fabrica-view.component';
import { SetUserCargoDTOCargoEnum } from '@/api';
import { CargoGuard } from './guard/Cargo.guard';
import { FabricasParaAvaliacaoViewComponent } from './widgets/fabricas-para-avaliacao-view/fabricas-para-avaliacao-view.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'app',
        pathMatch: 'full',
    },
    {
        path: 'app',
        loadComponent: () => HomePageComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '', redirectTo: 'fabricaPrincipal', pathMatch: 'full'
            },
            {
                path: 'fabricaPrincipal',
                canActivate: [CargoGuard],
                loadComponent: () => FabricaPrincipalViewComponent,
                data: {
                    roles: [
                        SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP, SetUserCargoDTOCargoEnum.USER
                    ]
                }
            },
            {
                path: 'fabrica/:fabricaId',
                canActivate: [CargoGuard],
                loadComponent: () => FabricaPageComponent,
                data: {
                    roles: [
                        SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP, SetUserCargoDTOCargoEnum.USER
                    ]
                }
            },
            {
                path: 'pedidos',
                canActivate: [CargoGuard],
                loadComponent: () => PedidosFabricaViewComponent,
                data: {
                    roles: [
                        SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP
                    ]
                }
            },
            {
                path: 'fabricaAvaliacao',
                canActivate: [CargoGuard],
                loadComponent: () => FabricasParaAvaliacaoViewComponent,
                data: {
                    roles: [
                        SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP
                    ]
                }
            },
        ]
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
        data: {
            roles: [
                SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP, SetUserCargoDTOCargoEnum.USER
            ]
        }
    },
    {
        path: 'fabrica/:fabricaId',
        loadComponent: () => FabricaPageComponent,
        canActivate: [AuthGuard]
    }
];
