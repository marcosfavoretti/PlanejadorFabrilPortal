import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { PedidosPlanejadosResponseDTO} from "@/api/planejador";
import { computed, inject, Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { FabricaService } from "./Fabrica.service";
import { TreeNode } from "primeng/api";

@Injectable({ providedIn: 'root' })
export class PedidoPlanejadosStoreService extends
    SignalStore<PedidosPlanejadosResponseDTO[]> {
    private fabricaService = inject(FabricaService);


    refresh(fabricaId: string): Observable<PedidosPlanejadosResponseDTO[]> {
        console.log(fabricaId)
        this.initialized = true;
        return this.fabricaService.consultarPedidosPlanejados({ fabricaId })
            .pipe(tap(data => this.set(data)));
    }

    readonly treeNodes = computed<TreeNode[]>(() => {
        const pedidos = this.item() || []; // signal do SignalStore
        return pedidos.map(d => ({
            data: d,
            top: true,
            leyer: 1,
            label: d.pedido.codigo,
            children: d.dividas.map(divida => ({
                label: `Valor em divida para o setor ${divida.setorCodigo} = ${divida.qtd}`,
                data: divida,
                layer: 2,
                top: false
            })).concat(
                d.atrasos.map(atraso => ({
                    label: `Valor em atraso para o setor ${atraso.setorCodigo} = ${atraso.qtd}`,
                    data: atraso,
                    layer: 3,
                    top: false
                })
                )
            )

        }));
    });
}