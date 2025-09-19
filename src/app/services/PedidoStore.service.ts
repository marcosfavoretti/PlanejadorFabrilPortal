import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { computed, inject, Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { PedidoService } from "./Pedido.service";
import { PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum, PedidoResponseDTO } from "@/api";
import { ChartClasses } from "primeng/chart";
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
        const labels = Array.from(new Set(items.map(a => a.dataEntrega)));
        const amount = labels.map(l => items.filter(i => i.dataEntrega === l).reduce((tot, a) => tot += a.lote, 0));

        return {
            labels: labels.map(l => format(addDays(l, 1), 'dd/MM/yyyy')),//workaround ruim
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
        const labels = Array.from(new Set(items.map(a => a.dataEntrega)));
        const amount = labels.map(l => items.filter(i => i.dataEntrega === l).length);

        return {
            labels: labels.map(l => format(addDays(l, 1), 'dd/MM/yyyy')),//workaround ruim
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