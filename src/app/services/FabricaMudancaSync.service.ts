import { inject, Injectable } from "@angular/core";
import { PlanejamentoStoreService } from "./PlanejamentoStore.service";
import { GanttStoreService } from "./GanttStore.service";
import { PedidoPlanejadosStoreService } from "./PedidoPlanejadoStore.service";
import { forkJoin, switchMap, tap } from "rxjs"; // Remova 'tap' se não for usar pra log
import { PedidoStoreService } from "./PedidoStore.service";
import { PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum } from "@/api/planejador";
import { FabricaMudancaStore } from "./FabricaMudancaStore.service";
import { ContextoFabricaService } from "./ContextoFabrica.service";

@Injectable({
    providedIn: 'root'
})
export class FabricaMudancaSyncService {
    planejamentoStore = inject(PlanejamentoStoreService);
    ganntStore = inject(GanttStoreService);
    pedidoPlanejadoStore = inject(PedidoPlanejadosStoreService);
    pedido = inject(PedidoStoreService);
    mudancaStore = inject(FabricaMudancaStore);
    fabricaStore = inject(ContextoFabricaService);

    sync(fabricaId: string): void {
        const contextEhPrincipal = this.fabricaStore.item()?.principal;
        
        // Define qual observable inicial usar
        const fabricaContext$ = contextEhPrincipal 
            ? this.fabricaStore.refresh() 
            : this.fabricaStore.refresh(fabricaId);

        fabricaContext$
            .pipe(
                switchMap(fabrica => {
                    const contextFabricaId = fabrica.fabricaId;
                    const syncObs = [
                        this.mudancaStore.refresh(),
                        this.pedido.refresh(PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum.todos),
                        this.ganntStore.refresh(contextFabricaId),
                        this.planejamentoStore.refresh(contextFabricaId),
                        this.pedidoPlanejadoStore.refresh(contextFabricaId)
                    ];
                    return forkJoin(syncObs);
                })
            )
            .subscribe({
                next: (results) => console.log('Sincronização concluída com sucesso', results),
                error: (err) => console.error('Erro na sincronização', err)
            });
    }
}