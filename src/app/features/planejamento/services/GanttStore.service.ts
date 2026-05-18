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

    override set(value: GetGanttInformationDto): void {
        this._original = value;
        super.set(value);
    }

    override clear(): void {
        this._original = null;
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
        if (!this._original) return;
        if (!Array.isArray(this._original.data)) {
            this._item.set(this._original);
            return;
        }

        const normalizedTerm = term.trim().toLowerCase();
        if (!normalizedTerm) {
            this.clearFilter();
            return;
        }

        const filteredData = this._original.data.filter(item =>
            JSON.stringify(item).toLowerCase().includes(normalizedTerm)
        );

        this._item.set({
            ...this._original,
            data: filteredData
        } as GetGanttInformationDto);
    }

    clearFilter(): void {
        if (!this._original) return;
        this._item.set(this._original);
    }
}
