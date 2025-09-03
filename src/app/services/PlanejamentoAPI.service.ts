import { from, Observable } from "rxjs";
import { GetGanttInformationDto, GetTabelaProducaoDiarioDTO, planejamentoControllerDatasPlanejadasMethod, PlanejamentoControllerDatasPlanejadasMethod200, producaoSimulacaoControllerConsultarMercadoMethod, producaoSimulacaoControllerGenTabelaDiariaMethod, ProducaoSimulacaoControllerGenTabelaDiariaMethodQueryParams,  producaoSimulacaoControllerSaveTabelaDiariaMethod, ProducaoSimulacaoControllerSaveTabelaDiariaMethodMutationRequest, replanejamentoControllerReplanejamentoMethod, GetMercadosEntreSetoresTabelaDto, KPIControllerGetGanttInformationMethod, KPIControllerGetGanttInformationMethodQueryParams } from "../../api";
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

    requestMercado(): Observable<GetMercadosEntreSetoresTabelaDto[]> {
        return from(
            producaoSimulacaoControllerConsultarMercadoMethod()
                .then((d) => d)
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

    requestGanttData(dto: KPIControllerGetGanttInformationMethodQueryParams): Observable<GetGanttInformationDto> {
        return from(
            KPIControllerGetGanttInformationMethod(dto)
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