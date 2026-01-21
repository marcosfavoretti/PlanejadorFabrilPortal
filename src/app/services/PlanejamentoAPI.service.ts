import { from, Observable } from "rxjs";
import { GetGanttInformationDto, planejamentoControllerDatasPlanejadasMethod, PlanejamentoControllerDatasPlanejadasMethod200,  KPIControllerGetGanttInformationMethod, KPIControllerGetGanttInformationMethodQueryParams } from "../../api/planejador";
import { Injectable } from "@angular/core";
@Injectable({
    providedIn: 'root'
})
export class PlanejamentoAPIService {
 
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