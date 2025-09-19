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
import { PedidoStoreService } from "./PedidoStore.service";
import { PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum } from "@/api";
import { GlobalFilterInputText } from "./GlobalInputText.service";

@Injectable({
    providedIn: 'root'
})
export class PedidoStartUp implements IStartUp, IShutDown {
    userService = inject(UserService);
    popUpService = inject(LoadingPopupService);
    //
    userStore = inject(UserstoreService);
    fabricaStore = inject(ContextoFabricaService);
    pedidoPlenejadoStore = inject(PedidoPlanejadosStoreService);
    pedidoStoreService = inject(PedidoStoreService);
    ganttStore = inject(GanttStoreService);
    globalFilter = inject(GlobalFilterInputText);
    //    
    startUp(): void {

        const flow$ = this.fabricaStore.initialize(undefined)
            .pipe(
                switchMap(() =>
                    forkJoin([
                        this.pedidoPlenejadoStore.initialize(this.fabricaStore.item()?.fabricaId),
                        this.pedidoStoreService.initialize(PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum.todos),
                        this.ganttStore.initialize(this.fabricaStore.item()?.fabricaId)
                    ])
                )
            )
        flow$.subscribe();
    }

    shutDown(): void {
        this.globalFilter.resetText();
        this.fabricaStore.resetStore();
        this.pedidoPlenejadoStore.resetStore();
        this.ganttStore.resetStore();
    }
}