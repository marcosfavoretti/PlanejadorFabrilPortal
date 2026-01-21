import { ConsultarTabelaCapabilidadeDTO, itemControllerCadastrarItemCapabilidadeMethod, itemControllerGetItemCapabilildadeMethod } from "@/api/planejador";
import { Injectable } from "@angular/core";
import { from, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ItemService {
    consultaCapabilidade(): Observable<ConsultarTabelaCapabilidadeDTO[]> {
        return from(
            itemControllerGetItemCapabilildadeMethod()
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        );
    }

    atualizaCapabilidade(dto: ConsultarTabelaCapabilidadeDTO): Observable<void> {
        return from(
            itemControllerCadastrarItemCapabilidadeMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        )
    }
}