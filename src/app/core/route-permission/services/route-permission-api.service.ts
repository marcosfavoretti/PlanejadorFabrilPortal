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
import { from, Observable } from 'rxjs';

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
    return from(appEthosControllerGetRoutesForUser());
  }
}
