import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { GetGanttInformationDto, KPIControllerGetGanttInformationMethodQueryParamsColorirEnum } from "@/api/planejador";
import { inject, Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { PlanejamentoAPIService } from "./planejamento-api.service";

@Injectable({ providedIn: 'root' })
export class GanttStoreService extends SignalStore<GetGanttInformationDto> {
    planejamentoAPI = inject(PlanejamentoAPIService);
    viewMode: KPIControllerGetGanttInformationMethodQueryParamsColorirEnum = KPIControllerGetGanttInformationMethodQueryParamsColorirEnum.operacao;
    private _original: GetGanttInformationDto | null = null;
    private _filterTerm = '';

    override set(value: GetGanttInformationDto): void {
        this._original = value;
        super.set(this.filterValue(value));
    }

    override clear(): void {
        this._original = null;
        this._filterTerm = '';
        super.clear();
    }

    override refresh(fabricaId?: string): Observable<GetGanttInformationDto> {
        if (!fabricaId) {
            throw new Error('GanttStoreService.refresh requires fabricaId');
        }

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

    applyFilter(term: string): void {
        this._filterTerm = term;
        if (!this._original) return;
        this._item.set(this.filterValue(this._original));
    }

    clearFilter(): void {
        this._filterTerm = '';
        if (!this._original) return;
        this._item.set(this._original);
    }

    private filterValue(value: GetGanttInformationDto): GetGanttInformationDto {
        if (!Array.isArray(value.data)) {
            return value;
        }

        const normalizedTerm = this._filterTerm.trim().toLowerCase();
        if (!normalizedTerm) {
            return value;
        }

        const filteredData = value.data.filter(item =>
            JSON.stringify(item).toLowerCase().includes(normalizedTerm)
        );

        return {
            ...value,
            data: filteredData
        } as GetGanttInformationDto;
    }
}
