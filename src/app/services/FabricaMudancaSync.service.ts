import { inject, Injectable } from "@angular/core";
import { PlanejamentoStoreService } from "./PlanejamentoStore.service";
import { GanttStoreService } from "./GanttStore.service";
import { PedidoPlanejadosStoreService } from "./PedidoPlanejadoStore.service";
import { forkJoin } from "rxjs";
import { PedidoStoreService } from "./PedidoStore.service";
import { PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum } from "@/api";

@Injectable({
    providedIn: 'root'
})
export class FabricaMudancaSyncService {
    planejamentoStore = inject(PlanejamentoStoreService);
    ganntStore = inject(GanttStoreService);
    pedidoPlanejadoStore = inject(PedidoPlanejadosStoreService);
    pedido = inject(PedidoStoreService);
    sync(fabricaId: string): void {
        const syncObs = [
            this.pedido.refresh(PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum.todos),
            this.ganntStore.refresh(fabricaId),
            this.planejamentoStore.refresh(fabricaId),
            this.pedidoPlanejadoStore.refresh(fabricaId)
        ]
        forkJoin(syncObs)
            .subscribe();
    }
}