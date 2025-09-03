import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { GetGanttInformationDto, KPIControllerGetGanttInformationMethodQueryParams, KPIControllerGetGanttInformationMethodQueryParamsColorirEnum } from "@/api";
import { inject, Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { PlanejamentoAPIService } from "./PlanejamentoAPI.service";

@Injectable({ providedIn: 'root' })
export class GanttStoreService extends SignalStore<GetGanttInformationDto> {
    planejamentoAPI = inject(PlanejamentoAPIService);

    viewMode: KPIControllerGetGanttInformationMethodQueryParamsColorirEnum = KPIControllerGetGanttInformationMethodQueryParamsColorirEnum.operacao;

    refreshGantt(fabricaId: string): Observable<GetGanttInformationDto> {
        return this.planejamentoAPI.requestGanttData(
            {
                fabricaId: fabricaId,
                colorir: this.viewMode
            })
            .pipe(
                tap(
                    plan => this.set(plan)
                )
            );
    }
}