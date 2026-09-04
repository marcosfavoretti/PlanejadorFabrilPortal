import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';

/**
 * Mantém o quadro e o detalhe na mesma configuração de rota. Assim, ao
 * acrescentar/remover `/detail/:numPrograma`, o Angular reaproveita a página
 * já carregada em vez de recriar o Kanban inteiro.
 */
const producaoMatcher = (segments: UrlSegment[]): UrlMatchResult | null => {
  if (segments[0]?.path !== 'producao') return null;

  if (segments.length === 1) return { consumed: segments };

  if (segments.length === 3 && segments[1].path === 'detail' && segments[2].path) {
    return { consumed: segments, posParams: { numPrograma: segments[2] } };
  }

  return null;
};

export const PROD_LASER_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'producao' },
  {
    path: 'criticados',
    loadComponent: () => import('./pages/prod-laser-criticados-page/prod-laser-criticados-page.component').then(m => m.ProdLaserCriticadosPageComponent),
  },
  {
    matcher: producaoMatcher,
    loadComponent: () => import('./pages/prod-laser-page/prod-laser-page.component').then(m => m.ProdLaserPageComponent),
  },
];
