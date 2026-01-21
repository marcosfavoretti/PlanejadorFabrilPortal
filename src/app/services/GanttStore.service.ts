import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { GetGanttInformationDto, KPIControllerGetGanttInformationMethodQueryParamsColorirEnum } from "@/api/planejador";
import { inject, Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { PlanejamentoAPIService } from "./PlanejamentoAPI.service";

@Injectable({ providedIn: 'root' })
export class GanttStoreService extends SignalStore<GetGanttInformationDto> {
    planejamentoAPI = inject(PlanejamentoAPIService);
    viewMode: KPIControllerGetGanttInformationMethodQueryParamsColorirEnum = KPIControllerGetGanttInformationMethodQueryParamsColorirEnum.operacao;

    refresh(fabricaId: string): Observable<GetGanttInformationDto> {
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

    override onGlobalInputFilterApplied(filter: string | undefined): void {
        this.filterApplied = true;

        if (!this._original) return;

        // se não tem .data ou não é array, só seta o valor original
        if (!Array.isArray((this._original as any).data)) {
            this._item.set(this._original);
            this.filterApplied = false;
            return;
        }

        // se não existe filtro, retorna o original
        if (!filter) {
            this._item.set(this._original);
            this.filterApplied = false;
            return;
        }

        // filtra apenas o array dentro de data
        const originalObj = this._original as { data: any[] };
        const filteredData = originalObj.data.filter(item =>
            JSON.stringify(item).toLowerCase().includes(filter.toLowerCase())
        );

        // seta uma cópia do objeto com o array filtrado
        this._item.set({
            ...originalObj,
            data: filteredData
        } as GetGanttInformationDto);
    }

}