import {
  AceiteCompraResponseDto,
  logixPluginControllerConsultarDetalhesPedido,
  logixPluginControllerListarPedidosAceiteCompra,
  logixPluginControllerProcessarAceiteCompra,
  PedidoAceiteCompraDetalheDto,
  PedidoAceiteCompraResumoDto,
  ProcessarAceiteCompraDto,
} from '@/api/logix-plugin';
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LogixAceiteCompraApiService {
  listarPedidos(page = 0, limit = 10): Observable<PedidoAceiteCompraResumoDto[]> {
    return from(logixPluginControllerListarPedidosAceiteCompra({
      params: { page, limit },
    }));
  }

  consultarDetalhesPedido(
    pedido: string,
    codEmpresa?: string,
  ): Observable<PedidoAceiteCompraDetalheDto[]> {
    return from(logixPluginControllerConsultarDetalhesPedido(pedido, codEmpresa));
  }

  processarAceiteCompra(dto: ProcessarAceiteCompraDto): Observable<AceiteCompraResponseDto> {
    return from(logixPluginControllerProcessarAceiteCompra(dto));
  }
}
