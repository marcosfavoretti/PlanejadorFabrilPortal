import { inject, Injectable } from "@angular/core";
import { appEthosControllerAtualizaRoutes, AppEthosControllerAtualizaRoutesMutationRequest, appEthosControllerCriaRoutes, AppEthosControllerCriaRoutesMutationRequest, appEthosControllerDeletaRoutes, appEthosControllerGetRoutesForUser, ResAppRouteAppDTO } from "../../api/routes";
import { from, Observable } from "rxjs";
import { UserstoreService } from "./userstore.service";
@Injectable({
    providedIn: 'root'
})
export class RoutePermissionApiService {
    //
    private readonly userStore = inject(UserstoreService);
    //
    createRota(dto: AppEthosControllerCriaRoutesMutationRequest): Observable<ResAppRouteAppDTO> {
        return from(appEthosControllerCriaRoutes(dto)
            .then((data) => data)
            .catch(err => {
                throw err;
            }));
    }

    //
    updateRota(id: string, dto: AppEthosControllerAtualizaRoutesMutationRequest): Observable<ResAppRouteAppDTO> {
        return from(appEthosControllerAtualizaRoutes(id, dto)
            .then((data) => data)
            .catch(err => {
                throw err;
            }));
    }

    //
    deleteRota(id: string): Observable<void> {
        return from(appEthosControllerDeletaRoutes(id)
            .then((data) => data)
            .catch(err => {
                throw err;
            }));


    }

    //
    getRotaByUser(): Observable<ResAppRouteAppDTO[]> {
        return from(appEthosControllerGetRoutesForUser()
            .then((data) => data)
            .catch(err => {
                throw err;
            }));
    }
}   