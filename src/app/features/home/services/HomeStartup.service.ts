import { inject, Injectable } from "@angular/core";
import { UserstoreService } from "@/app/core/user/stores/user-store.service";
import { UserService } from "@/app/core/user/services/User.service";
import { LoadingPopupService } from "@/app/shared/services/loading-popup.service";
import { forkJoin, switchMap } from "rxjs";
import { PedidoPlanejadosStoreService } from "@/app/features/planejamento/services/PedidoPlanejadoStore.service";
import { ContextoFabricaService } from "@/app/features/planejamento/services/ContextoFabrica.service";
import { GanttStoreService } from "@/app/features/planejamento/services/GanttStore.service";
import { IStartup } from "@/@core/abstract/IStartup";
import { IShutDown } from "@/@core/abstract/IShutDown";
import { FabricaMudancaStore } from "@/app/features/planejamento/services/FabricaMudancaStore.service";

@Injectable({
    providedIn: 'root'
})
export class HomeStartupService implements IStartup, IShutDown {
    userService = inject(UserService);
    popUpService = inject(LoadingPopupService);
    //
    userStore = inject(UserstoreService);
    fabricaStore = inject(ContextoFabricaService);
    pedidoPlenejadoStore = inject(PedidoPlanejadosStoreService);
    ganttStore = inject(GanttStoreService);
    mudancaStore = inject(FabricaMudancaStore);

    startup(): void {
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
    }
}
