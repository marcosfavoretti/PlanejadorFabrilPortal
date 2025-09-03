import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { PedidosPlanejadosResponseDTO, PlanejamentoResponseDTO } from "@/api";
import { computed, inject, Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { FabricaService } from "./Fabrica.service";
import { TreeNode } from "primeng/api";

@Injectable({ providedIn: 'root' })
export class PedidoPlanejadosStoreService extends SignalStore<PedidosPlanejadosResponseDTO[]> {
    private fabricaService = inject(FabricaService);

    refreshPedidos(fabricaId: string) {
        return this.fabricaService.consultarPedidosPlanejados({ fabricaId })
            .pipe(tap(data => this.set(data)));
    }

    readonly treeNodes = computed<TreeNode[]>(() => {
        const pedidos = this.item() || []; // signal do SignalStore
        return pedidos.map(d => ({
            data: d,
            top: true,
            label: d.pedido.codigo,
            children: d.dividas.map(divida => ({
                label: `Valor em divida para o setor ${divida.setorCodigo} = ${divida.qtd}`,
                data: divida,
                top: false
            }))
        }));
    });
}