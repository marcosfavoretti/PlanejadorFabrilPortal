import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { computed, inject, Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { PedidoService } from "./Pedido.service";
import { PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum, PedidoResponseDTO } from "@/api/planejador";
import { addDays, format } from "date-fns";

@Injectable({
    providedIn: 'root'
})
export class PedidoStoreService
    extends SignalStore<PedidoResponseDTO[]> {

    pedidoApi = inject(PedidoService)

    override refresh(props: PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum): Observable<unknown> {
        const pedido$ = this.pedidoApi.consultaPedido({
            tipoConsulta: props
        })
            .pipe(
                tap(
                    pedido => this.set(pedido)
                )
            );
        return pedido$;
    }

    pedidoLoteChart = computed(() => {
        const items = this.item() ?? [];
        
        const groups = new Map<string, number>();
        items.forEach(i => {
            const dateObj = new Date(i.dataEntrega);
            const key = format(dateObj, 'yyyy-MM-dd');
            groups.set(key, (groups.get(key) || 0) + i.lote);
        });

        const sortedKeys = Array.from(groups.keys()).sort();

        const labels = sortedKeys.map(key => {
            const [year, month, day] = key.split('-').map(Number);
            return format(new Date(year, month - 1, day), 'dd/MM/yyyy');
        });
        
        const amount = sortedKeys.map(key => groups.get(key));

        return {
            labels: labels,//workaround ruim
            datasets: [
                {
                    label: 'Pedidos agrupados por datas de entrega (totalizando lote)',
                    data: amount,
                    backgroundColor: labels.map(() => 'rgba(255, 3, 3, 0.2)') // por label
                }
            ]
        };
    });

    pedidoQuantidadeChart = computed(() => {
        const items = this.item() ?? [];

        const groups = new Map<string, number>();
        items.forEach(i => {
            const dateObj = new Date(i.dataEntrega);
            const key = format(dateObj, 'yyyy-MM-dd');
            groups.set(key, (groups.get(key) || 0) + 1);
        });

        const sortedKeys = Array.from(groups.keys()).sort();

        const labels = sortedKeys.map(key => {
            const [year, month, day] = key.split('-').map(Number);
            return format(new Date(year, month - 1, day), 'dd/MM/yyyy');
        });

        const amount = sortedKeys.map(key => groups.get(key));

        return {
            labels: labels,//workaround ruim
            datasets: [
                {
                    label: 'Pedidos agrupados por datas de entrega (contagem de pedidos)',
                    data: amount,
                    backgroundColor: labels.map(() => 'rgba(75, 192, 192, 0.2)') // por label
                }
            ]
        };
    });
}