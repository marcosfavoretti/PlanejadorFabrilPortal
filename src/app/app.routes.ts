import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { FabricaPageComponent } from './pages/fabrica-page/fabrica-page.component';
import { LoginScreenComponent } from './pages/login-screen/login-screen.component';
import { RegisterScreenComponent } from './pages/register-screen/register-screen.component';
import { AuthGuard } from './guard/Auth.guard';
import { ItemPaginaComponent } from './pages/item-pagina/item-pagina.component';
import { FabricaPrincipalViewComponent } from './widgets/fabrica-principal-view/fabrica-principal-view.component';
import { PedidosFabricaViewComponent } from './widgets/pedidos-fabrica-view/pedidos-fabrica-view.component';
import { CargoGuard } from './guard/Cargo.guard';
import { FabricasParaAvaliacaoViewComponent } from './widgets/fabricas-para-avaliacao-view/fabricas-para-avaliacao-view.component';
import { FabricaPageReadOnlyComponent } from './widgets/fabrica-page-read-only/fabrica-page-read-only.component';
import { RelogioPontPageComponent } from './pages/relogio-pont-page/relogio-pont-page.component';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { CertificadoCaterpillarPageComponent } from './pages/certificado-caterpillar-page/certificado-caterpillar-page.component';
import { FabricaPrincipalPageComponent } from './pages/fabrica-principal-page/fabrica-principal-page.component';
import { MinhasFabricasPageComponent } from './pages/minhas-fabricas-page/minhas-fabricas-page.component';
import { WelcomePageComponent } from './pages/welcome-page/welcome-page.component';
import { WifiSolicitationPageComponent } from './pages/wifi-solicitation-page/wifi-solicitation-page.component';
import { WifiConfirmationPageComponent } from './pages/wifi-confirmation-page/wifi-confirmation-page.component';
import { ContagemBufferPageComponent } from './pages/contagem-buffer-page/contagem-buffer-page.component';
export const routes: Routes = [
    {
        path: '',
        redirectTo: 'welcome',
        pathMatch: 'full',
    },
    {
        path: 'app',
        redirectTo: 'welcome'
    },
    {
        path: 'welcome',
        loadComponent: () => HomePageComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '', loadComponent: () => WelcomePageComponent
            }
        ]
    },
    //planejador routes
    {
        path: 'planejamentos',
        loadComponent: () => FabricaPrincipalPageComponent,
        canActivate: [AuthGuard, CargoGuard],
        children: [
            {
                path: '', redirectTo: 'fabricaPrincipal', pathMatch: 'full'
            },
            {
                path: 'fabricaPrincipal',
                canActivate: [AuthGuard, CargoGuard],
                loadComponent: () => FabricaPrincipalViewComponent,
                data: {
                    roles: [
                        SetUserCargoDTOCargoEnum.CATERPILLAR_USER,
                        SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP, SetUserCargoDTOCargoEnum.USER
                    ]
                }
            },
            {
                path: 'minhas-fabricas',
                canActivate: [AuthGuard, CargoGuard],
                loadComponent: () => MinhasFabricasPageComponent,
                data: {
                    roles: [
                        SetUserCargoDTOCargoEnum.CATERPILLAR_USER,
                        SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP, SetUserCargoDTOCargoEnum.USER
                    ]
                }
            },
            {
                path: 'fabrica/:fabricaId',
                canActivate: [AuthGuard, CargoGuard],
                loadComponent: () => FabricaPageComponent,
                data: {
                    roles: [
                        SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP, SetUserCargoDTOCargoEnum.USER
                    ]
                }
            },
            {
                path: 'RO/fabrica/:fabricaId',
                canActivate: [AuthGuard, CargoGuard],
                loadComponent: () => FabricaPageReadOnlyComponent,
                data: {
                    roles: [
                        SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP, SetUserCargoDTOCargoEnum.USER
                    ]
                }
            },
            {
                path: 'pedidos',
                canActivate: [AuthGuard, CargoGuard],
                loadComponent: () => PedidosFabricaViewComponent,
                data: {
                    roles: [
                        SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP
                    ]
                }
            },
            {
                path: 'fabricaAvaliacao',
                canActivate: [AuthGuard, CargoGuard],
                loadComponent: () => FabricasParaAvaliacaoViewComponent,
                data: {
                    roles: [
                        SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP
                    ]
                }
            },
            {
                path: 'capabilidades',
                canActivate: [AuthGuard, CargoGuard],
                loadComponent: () => ItemPaginaComponent,
                data: {
                    roles: [SetUserCargoDTOCargoEnum.ADMIN, SetUserCargoDTOCargoEnum.PCP]
                }
            }
        ]
    },
    //certificados routes
    {
        path: 'certificados',
        loadComponent: () => CertificadoCaterpillarPageComponent,
        canActivate: [AuthGuard, CargoGuard]
    },
    //auth routes
    {
        path: 'register',
        loadComponent: () => RegisterScreenComponent
    },
    {
        path: 'login',
        loadComponent: () => LoginScreenComponent
    },
    //ponto routes
    {
        path: 'ponto',
        loadComponent: () => RelogioPontPageComponent,
        canActivate: [AuthGuard],
    },
    //wifi routes
    {
        path: 'wifi',
        loadComponent: () => WifiSolicitationPageComponent
    },
    {
        path: 'wifi/:id',
        loadComponent: () => WifiConfirmationPageComponent
    },
    // buffer routes
    {
        path: 'buffer',
        loadComponent: () => ContagemBufferPageComponent
    },
];
