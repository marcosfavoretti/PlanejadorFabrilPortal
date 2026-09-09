import { SignalStore } from '@/@core/abstract/SignalStore.abstract';
import { ResAppRouteAppDTO } from '@/api/routes';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { RoutePermissionApiService } from '../services/route-permission-api.service';

/**
 * Extensão do contrato gerado para campos opcionais retornados pela API de
 * rotas. Mantida fora do cliente Kubb para não ser sobrescrita na geração.
 */
export type NavigationRoute = ResAppRouteAppDTO & {
  tag?: string | null;
  centrosCusto?: number[];
};

@Injectable({
  providedIn: 'root'
})
export class RoutePermissionStoreService extends SignalStore<NavigationRoute[]> {
  private readonly routePermissonApiService = inject(RoutePermissionApiService);

  override refresh(): Observable<NavigationRoute[]> {
    return this.routePermissonApiService.getRotaByUser().pipe(
      tap(routes => {
        this.set(this.normalizeRoutes(routes));
      })
    );
  }

  private normalizeRoutes(routes: unknown): NavigationRoute[] {
    if (!Array.isArray(routes)) {
      return [];
    }

    return routes.map((route): NavigationRoute => ({
      ...route,
      cargos: Array.isArray(route.cargos) ? route.cargos : [],
      subRoutes: Array.isArray(route.subRoutes) ? route.subRoutes : [],
      tag: typeof route.tag === 'string' && route.tag.trim() ? route.tag.trim() : null,
      centrosCusto: Array.isArray(route.centrosCusto) ? route.centrosCusto : [],
    }));
  }
}
