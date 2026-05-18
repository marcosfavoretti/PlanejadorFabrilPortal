import { Routes } from '@angular/router';
import { AuthGuard } from '@/app/guard/Auth.guard';
import { CargoGuard } from '@/app/guard/Cargo.guard';
import { ESTRUTURA_ROLES } from '@/app/core/auth/role-groups';

export const ESTRUTURA_ROUTES: Routes = [
  {
    path: 'checklist',
    loadComponent: () =>
      import('@/app/features/estrutura/pages/estrutura-index-page/home-page.component').then(
        (m) => m.HomePageComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@/app/features/estrutura/pages/check-list-page/check-list-page.component').then(
            (m) => m.CheckListPageComponent,
          ),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('@/app/features/estrutura/pages/estrutura-index-page/home-page.component').then(
        (m) => m.HomePageComponent,
      ),
    canActivate: [AuthGuard, CargoGuard],
    data: {
      roles: ESTRUTURA_ROLES,
    },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@/app/features/estrutura/pages/estrutura-hero-page/estrutura-hero-page.component').then(
            (m) => m.EstruturaHeroPageComponent,
          ),
      },
      {
        path: 'consultar',
        loadComponent: () =>
          import('@/app/features/estrutura/pages/consult-struct/consult-struct.component').then(
            (m) => m.ConsultStructComponent,
          ),
      },
      {
        path: 'checklist/admin',
        loadComponent: () =>
          import('@/app/features/estrutura/pages/check-list-admin-page/check-list-admin-page.component').then(
            (m) => m.CheckListAdminPageComponent,
          ),
      },
      {
        path: 'analise',
        loadComponent: () =>
          import('@/app/features/estrutura/pages/struct-analytics/struct-analytics.component').then(
            (m) => m.StructAnalyticsComponent,
          ),
      },
      {
        path: 'onde-usado',
        loadComponent: () =>
          import('@/app/features/estrutura/pages/where-used-struct/where-used-struct.component').then(
            (m) => m.WhereUsedStructComponent,
          ),
      },
      {
        path: 'export',
        loadComponent: () =>
          import('@/app/features/estrutura/pages/export-estrutura-page/export-estrutura-page.component').then(
            (m) => m.ExportEstruturaPageComponent,
          ),
      },
      {
        path: 'chatbot',
        loadComponent: () =>
          import('@/app/features/estrutura/pages/chatbot-estrutura-page/chatbot-estrutura-page.component').then(
            (m) => m.ChatbotEstruturaPageComponent,
          ),
      },
      {
        path: 'chatbot/:ssid',
        loadComponent: () =>
          import('@/app/features/estrutura/pages/chatbot-estrutura-page/chatbot-estrutura-page.component').then(
            (m) => m.ChatbotEstruturaPageComponent,
          ),
      },
    ],
  },
];
