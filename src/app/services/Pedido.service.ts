import { pedidoControllerConsultaPedidoMethod, PedidoControllerConsultaPedidoMethodQueryParams, PedidoResponseDTO } from "@/api";
import { Injectable } from "@angular/core";
import { from, Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class PedidoService {
    getFabricaPrincipal(dto: PedidoControllerConsultaPedidoMethodQueryParams): Observable<PedidoResponseDTO[]> {
        return from(
            pedidoControllerConsultaPedidoMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        );
    }
}