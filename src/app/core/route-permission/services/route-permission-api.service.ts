import {
  AppEthosControllerAtualizaRoutesMutationRequest,
  AppEthosControllerCriaRoutesMutationRequest,
  ResAppRouteAppDTO,
  appEthosControllerAtualizaRoutes,
  appEthosControllerCriaRoutes,
  appEthosControllerDeletaRoutes,
  appEthosControllerGetRoutesForUser
} from '@/api/routes';
import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoutePermissionApiService {
  createRota(dto: AppEthosControllerCriaRoutesMutationRequest): Observable<ResAppRouteAppDTO> {
    return from(appEthosControllerCriaRoutes(dto));
  }

  updateRota(id: string, dto: AppEthosControllerAtualizaRoutesMutationRequest): Observable<ResAppRouteAppDTO> {
    return from(appEthosControllerAtualizaRoutes(id, dto));
  }

  deleteRota(id: string): Observable<void> {
    return from(appEthosControllerDeletaRoutes(id));
  }

  getRotaByUser(): Observable<ResAppRouteAppDTO[]> {
    return from(appEthosControllerGetRoutesForUser()).pipe(
      map((response) => this.normalizeRoutesResponse(response))
    );
  }

  private normalizeRoutesResponse(response: unknown): ResAppRouteAppDTO[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (typeof response === 'string' && response.includes('<!doctype html>')) {
      console.error('RoutePermissionApiService: gateway retornou HTML no endpoint de rotas.', response);
      return [];
    }

    console.error('RoutePermissionApiService: resposta inválida no endpoint de rotas.', response);
    return [];
  }
}
