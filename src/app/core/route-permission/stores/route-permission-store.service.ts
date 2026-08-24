import { SignalStore } from '@/@core/abstract/SignalStore.abstract';
import { ResAppRouteAppDTO } from '@/api/routes';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { RoutePermissionApiService } from '../services/route-permission-api.service';

@Injectable({
  providedIn: 'root'
})
export class RoutePermissionStoreService extends SignalStore<ResAppRouteAppDTO[]> {
  private readonly routePermissonApiService = inject(RoutePermissionApiService);

  override refresh(): Observable<ResAppRouteAppDTO[]> {
    return this.routePermissonApiService.getRotaByUser().pipe(
      tap(routes => {
        this.set(this.normalizeRoutes(routes));
      })
    );
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
