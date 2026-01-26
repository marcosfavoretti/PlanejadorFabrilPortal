import { inject, Injectable } from "@angular/core";
import { UserstoreService } from "./userstore.service";
import { UserService } from "./User.service";
import { LoadingPopupService } from "./LoadingPopup.service";
import { forkJoin, switchMap, tap } from "rxjs";
import { PedidoPlanejadosStoreService } from "./PedidoPlanejadoStore.service";
import { ContextoFabricaService } from "./ContextoFabrica.service";
import { GanttStoreService } from "./GanttStore.service";
import { IStartUp } from "@/@core/abstract/IStartUp";
import { IShutDown } from "@/@core/abstract/IShutDown";
import { GlobalFilterInputText } from "./GlobalInputText.service";
import { FabricaMudancaStore } from "./FabricaMudancaStore.service";

@Injectable({
    providedIn: 'root'
})
export class HomeStartUpService implements IStartUp, IShutDown {
    userService = inject(UserService);
    popUpService = inject(LoadingPopupService);
    //
    userStore = inject(UserstoreService);
    fabricaStore = inject(ContextoFabricaService);
    pedidoPlenejadoStore = inject(PedidoPlanejadosStoreService);
    ganttStore = inject(GanttStoreService);
    mudancaStore = inject(FabricaMudancaStore);
    globalFilter = inject(GlobalFilterInputText);

    startUp(): void {
        const flow$ = this.fabricaStore
            .initialize()
            .pipe(
                switchMap(() =>
                    forkJoin([
                        this.mudancaStore.initialize(),
                        this.pedidoPlenejadoStore.initialize(this.fabricaStore.item()?.fabricaId),
                        this.ganttStore.initialize(this.fabricaStore.item()?.fabricaId),
                    ])
                )
            )
        flow$.subscribe();
    }

    shutDown(): void {
        this.mudancaStore.resetStore();
        this.fabricaStore.resetStore();
        this.pedidoPlenejadoStore.resetStore();
        this.ganttStore.resetStore();
        this.globalFilter.resetText();
    }
}