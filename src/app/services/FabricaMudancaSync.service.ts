import { inject, Injectable } from "@angular/core";
import { PlanejamentoStoreService } from "./PlanejamentoStore.service";
import { GanttStoreService } from "./GanttStore.service";
import { PedidoPlanejadosStoreService } from "./PedidoPlanejadoStore.service";
import { forkJoin, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class FabricaMudancaSyncService {
    planejamentoStore = inject(PlanejamentoStoreService);
    ganntStore = inject(GanttStoreService);
    pedidoPlanejadoStore = inject(PedidoPlanejadosStoreService);

    sync(fabricaId: string): void {
        const syncObs = [
            this.ganntStore.refresh(fabricaId),
            this.planejamentoStore.refresh(fabricaId),
            this.pedidoPlanejadoStore.refresh(fabricaId)
        ]
        forkJoin(syncObs).subscribe();
    }
}