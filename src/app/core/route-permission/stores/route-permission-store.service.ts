import { SignalStore } from '@/@core/abstract/SignalStore.abstract';
import { ResAppRouteAppDTO } from '@/api/routes';
import { inject, Injectable, isDevMode } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { RoutePermissionApiService } from '../services/route-permission-api.service';
import { getRuntimeAppConfig } from '@/app/shared/config/runtime-app-config';

const ROUTE_PERMISSION_TEST_MOCK_STORAGE_KEY = 'route-permission:enable-estrutura-subroutes-mock';

@Injectable({
  providedIn: 'root'
})
export class RoutePermissionStoreService extends SignalStore<ResAppRouteAppDTO[]> {
  private readonly routePermissonApiService = inject(RoutePermissionApiService);

  override refresh(): Observable<ResAppRouteAppDTO[]> {
    return this.routePermissonApiService.getRotaByUser().pipe(
      tap(routes => {
        const normalizedRoutes = this.normalizeRoutes(routes);
        this.set(
          this.shouldUseEstruturaSubrouteTestMock()
            ? this.withEstruturaSubrouteTestMock(normalizedRoutes)
            : normalizedRoutes
        );
      })
    );
  }

  private shouldUseEstruturaSubrouteTestMock(): boolean {
    if (!isDevMode() || !getRuntimeAppConfig().enableRoutePermissionMock || typeof localStorage === 'undefined') {
      return false;
    }

    return localStorage.getItem(ROUTE_PERMISSION_TEST_MOCK_STORAGE_KEY) === 'true';
  }

  private withEstruturaSubrouteTestMock(routes: ResAppRouteAppDTO[]): ResAppRouteAppDTO[] {
    const mockedRoutes = structuredClone(routes);

    let estruturaRoute = mockedRoutes.find(route => route.route === 'estrutura');

    if (!estruturaRoute) {
      estruturaRoute = {
        _id: 'mock-estrutura-id',
        cargos: [],
        name: 'Estrutura',
        route: 'estrutura',
        desc: 'Estrutura',
        subRoutes: []
      };
      mockedRoutes.push(estruturaRoute);
    }

    const requiredSubRoutes = [
      { _id: { id: 2 }, name: 'consultar estrutura', route: 'consultar', desc: 'Consultar estrutura' },
      { _id: { id: 5 }, name: 'análise estrutura', route: 'analise', desc: 'Análise da estrutura' },
      { _id: { id: 8 }, name: 'onde é usado', route: 'onde-usado', desc: 'Consulta de dependências da estrutura' },
      { _id: { id: 4 }, name: 'Checklist Admin', route: 'checklist/admin', desc: 'Administração do checklist' },
      { _id: { id: 3 }, name: 'Checklist', route: 'checklist', desc: 'Checklist de estrutura' },
      { _id: { id: 7 }, name: 'Chatbot', route: 'chatbot', desc: 'Chatbot de estrutura' },
      { _id: { id: 6 }, name: 'Exportar Estrutura', route: 'export', desc: 'Exportar/Sincronizar estrutura' },
    ];

    estruturaRoute.subRoutes ??= [];
    requiredSubRoutes.forEach(requiredRoute => {
      if (!estruturaRoute!.subRoutes.some(subRoute => subRoute.route === requiredRoute.route)) {
        estruturaRoute!.subRoutes.push(requiredRoute as never);
      }
    });

    return mockedRoutes;
  }

  private normalizeRoutes(routes: unknown): ResAppRouteAppDTO[] {
    if (!Array.isArray(routes)) {
      return [];
    }

    return routes.map(route => ({
      ...route,
      cargos: Array.isArray(route.cargos) ? route.cargos : [],
      subRoutes: Array.isArray(route.subRoutes) ? route.subRoutes : [],
    }));
  }
}
