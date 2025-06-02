import { from, Observable } from "rxjs";
import { GetGanttInformationDto, GetTabelaProducaoDiarioDTO, planejamentoControllerDatasPlanejadasMethod, PlanejamentoControllerDatasPlanejadasMethod200, producaoSimulacaoControllerGenTabelaDiariaMethod, ProducaoSimulacaoControllerGenTabelaDiariaMethodQueryParams, producaoSimulacaoControllerGetGanttInformationMethod, producaoSimulacaoControllerSaveTabelaDiariaMethod, ProducaoSimulacaoControllerSaveTabelaDiariaMethodMutation, ProducaoSimulacaoControllerSaveTabelaDiariaMethodMutationRequest, replanejamentoControllerReplanejamentoMethod } from "../../api";
import { Injectable } from "@angular/core";
@Injectable({
    providedIn: 'root'
})
export class PlanejamentoAPIService {
    requestTabelaProducao(filter: ProducaoSimulacaoControllerGenTabelaDiariaMethodQueryParams): Observable<GetTabelaProducaoDiarioDTO[]> {
        return from(
            producaoSimulacaoControllerGenTabelaDiariaMethod(filter)
                .then(d => d)
                .catch(err => { throw err })
        )
    }

    requestReplanejamento(): Observable<void> {
        return from(
            replanejamentoControllerReplanejamentoMethod()
                .then(() => { })
                .catch(err => { throw err })
        )
    }

    requestSaveTable(dto: ProducaoSimulacaoControllerSaveTabelaDiariaMethodMutationRequest): Observable<void> {
        return from(
            producaoSimulacaoControllerSaveTabelaDiariaMethod(dto)
                .then(() => { })
                .catch(err => { throw err })
        )
    }

    requestGanttData(): Observable<GetGanttInformationDto[]> {
        return from(
            producaoSimulacaoControllerGetGanttInformationMethod()
                .then((d) => d)
                .catch(err => { throw err })
        )
    }

    requestDates(): Observable<PlanejamentoControllerDatasPlanejadasMethod200> {
        return from(
            planejamentoControllerDatasPlanejadasMethod()
                .then(d => d)
                .catch(err => { throw err })
        )
    }
}