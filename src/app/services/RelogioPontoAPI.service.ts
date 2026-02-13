import { PaginatedResRegistroPontoTurnoPontoDTODto, pontoControllerConsultaMarcacaoMethod, PontoControllerConsultaMarcacaoMethodQueryParams, pontoKPIControllerConsultarMaisHorasIrregulares, PontoKPIControllerConsultarMaisHorasIrregularesQueryParams, ResRegistroPontoTurnoPontoDTO } from "@/api/relogio";
import { Injectable } from "@angular/core";
import { from, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class RelogioPontoAPIService {
    consultarPonto(dto: PontoControllerConsultaMarcacaoMethodQueryParams)
        : Observable<PaginatedResRegistroPontoTurnoPontoDTODto> {
        console.log('debug data log', dto);
        return from(
            pontoControllerConsultaMarcacaoMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        )
    }

    consultarPontosIrregularesKPI(dto: PontoKPIControllerConsultarMaisHorasIrregularesQueryParams): Observable<ResRegistroPontoTurnoPontoDTO[]> {
        {
            return from(
                pontoKPIControllerConsultarMaisHorasIrregulares(dto)
            )
        }

    }
}