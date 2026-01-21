import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { ResAppRouteAppDTO } from "@/api/routes";
import { inject, Injectable } from "@angular/core";
import { RoutePermissionApiService } from "./RoutePermissonApi.service";
import { Observable, tap } from "rxjs";
import { GlobalFilterInputText } from "./GlobalInputText.service";

@Injectable({
    providedIn: 'root'
})
export class RoutePermissionStoreService
    extends SignalStore<ResAppRouteAppDTO[]> {
    private readonly routePermissonApiService = inject(RoutePermissionApiService);

    override refresh(): Observable<ResAppRouteAppDTO[]> {
        return this.routePermissonApiService.getRotaByUser()
            .pipe(
                tap(
                    routes => this.set(routes)
                )
            );
    }

    override onGlobalInputFilterApplied(filter: string | undefined): void {
        //nao quero estrategia de filtro nessa store
        return;
    }
}