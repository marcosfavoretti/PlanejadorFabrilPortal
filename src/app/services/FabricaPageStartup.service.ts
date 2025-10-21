import { inject, Injectable } from "@angular/core";
import { UserstoreService } from "./userstore.service";
import { UserService } from "./User.service";
import { LoadingPopupService } from "./LoadingPopup.service";
import { forkJoin, switchMap, tap } from "rxjs";
import { PedidoPlanejadosStoreService } from "./PedidoPlanejadoStore.service";
import { ContextoFabricaService } from "./ContextoFabrica.service";
import { GanttStoreService } from "./GanttStore.service";
import { ActivatedRoute } from "@angular/router";
import { FabricaService } from "./Fabrica.service";
import { IShutDown } from "@/@core/abstract/IShutDown";
import { IStartUp } from "@/@core/abstract/IStartUp";
import { GlobalFilterInputText } from "./GlobalInputText.service";
import { FabricaMudancaStore } from "./FabricaMudancaStore.service";

@Injectable({
    providedIn: 'root'
})
export class FabricaPageStartUpService implements IShutDown, IStartUp {

    activatedRoute = inject(ActivatedRoute)
    userService = inject(UserService);
    userStore = inject(UserstoreService);
    fabricaService = inject(FabricaService);
    popUpService = inject(LoadingPopupService);
    //
    mudancaStore = inject(FabricaMudancaStore);

    pedidoPlenejadoStore = inject(PedidoPlanejadosStoreService);
    fabricaStore = inject(ContextoFabricaService);
    ganttStore = inject(GanttStoreService);
    globalFilter = inject(GlobalFilterInputText);

    startUp(fabricaId: string): void {
        const flow$ = this.fabricaStore.initialize(fabricaId)
            .pipe(
                switchMap(() =>
                    forkJoin([
                        this.mudancaStore.initialize(),
                        this.pedidoPlenejadoStore.initialize(this.fabricaStore.item()?.fabricaId),
                        this.ganttStore.initialize(this.fabricaStore.item()?.fabricaId)
                    ])
                )
            );
        flow$.subscribe();
    }

    shutDown(): void {
        this.fabricaStore.resetStore();
        this.pedidoPlenejadoStore.resetStore();
        this.ganttStore.resetStore();
        this.mudancaStore.resetStore();
        this.globalFilter.resetText();
    }
}