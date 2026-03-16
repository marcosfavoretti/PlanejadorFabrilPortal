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
import { MinhasFabricasPageComponent } from './pages/minhas-fabricas-page/minhas-fabricas-page.component';
import { WelcomePageComponent } from './pages/welcome-page/welcome-page.component';
import { WifiSolicitationPageComponent } from './pages/wifi-solicitation-page/wifi-solicitation-page.component';
import { WifiConfirmationPageComponent } from './pages/wifi-confirmation-page/wifi-confirmation-page.component';
import { ContagemBufferPageComponent } from './pages/contagem-buffer-page/contagem-buffer-page.component';
// import { FolhaHoraExtraListPageComponent } from './pages/folha-hora-extra-list-page/folha-hora-extra-list-page.component';
// import { FolhaHoraExtraFormPageComponent } from './pages/folha-hora-extra-form-page/folha-hora-extra-form-page.component';
// import { FolhaHoraExtraDetailPageComponent } from './pages/folha-hora-extra-detail-page/folha-hora-extra-detail-page.component';
import { ContentLayoutComponent } from './layouts/content-layout/content-layout.component';
import { PbIndexPageComponent } from './pages/pb-index-page/pb-index-page.component';
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
    {
        path: 'pb',
        loadComponent: () => PbIndexPageComponent,
        canActivate: [AuthGuard],

    },
    {
        path: 'pb/:grafico',
        loadComponent: () => PbIndexPageComponent,
        canActivate: [AuthGuard],
    },
    //planejador routes
    {
        path: 'planejamentos',
        loadComponent: () => ContentLayoutComponent,
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
        path: 'ponto/:ccs',
        loadComponent: () => ContentLayoutComponent, // Layout for all ponto routes
        canActivate: [AuthGuard], // Base AuthGuard for all ponto-related routes
        children: [
            // { path: 'he', loadComponent: () => FolhaHoraExtraListPageComponent },
            // { path: 'he/criar', loadComponent: () => FolhaHoraExtraFormPageComponent }, // /ponto/he/criar
            // { path: 'he/editar/:idFolha', loadComponent: () => FolhaHoraExtraFormPageComponent }, // /ponto/he/editar/123


            // { path: 'he/view/:idFolha', loadComponent: () => FolhaHoraExtraDetailPageComponent }, // /ponto/he/view/123
            //rotas de ponto de funcionarios
            {
                path: 'prefilter/:ccs', // /ponto/some_ccs_value - must be after specific he routes
                loadComponent: () => RelogioPontPageComponent
            },
            {
                path: '', // Matches exactly /ponto - must be last
                loadComponent: () => RelogioPontPageComponent,
                canActivate: [CargoGuard], // Additional guard for this specific case
                data: {
                    roles: [SetUserCargoDTOCargoEnum.ADMIN]
                }
            }
        ]
    },
    {
        path: 'ponto',
        loadComponent: () => ContentLayoutComponent, // Layout for all ponto routes
        canActivate: [AuthGuard, CargoGuard], // Base AuthGuard for all ponto-related routes
        data: {
            roles: [SetUserCargoDTOCargoEnum.ADMIN]
        },
        children: [
            // { path: 'he', loadComponent: () => FolhaHoraExtraListPageComponent },
            // { path: 'he/criar', loadComponent: () => FolhaHoraExtraFormPageComponent }, // /ponto/he/criar
            // { path: 'he/editar/:idFolha', loadComponent: () => FolhaHoraExtraFormPageComponent }, // /ponto/he/editar/123


            // { path: 'he/view/:idFolha', loadComponent: () => FolhaHoraExtraDetailPageComponent }, // /ponto/he/view/123
            //rotas de ponto de funcionarios
            {
                path: 'prefilter/:ccs', // /ponto/some_ccs_value - must be after specific he routes
                loadComponent: () => RelogioPontPageComponent
            },
            {
                path: '', // Matches exactly /ponto - must be last
                loadComponent: () => RelogioPontPageComponent,
                canActivate: [CargoGuard], // Additional guard for this specific case
                data: {
                    roles: [SetUserCargoDTOCargoEnum.ADMIN]
                }
            }
        ]
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
        loadComponent: () => ContagemBufferPageComponent,
        canActivate: [AuthGuard, CargoGuard],
        data: {
            roles: [SetUserCargoDTOCargoEnum.PCP, SetUserCargoDTOCargoEnum.ADMIN]
        }
    },
];
