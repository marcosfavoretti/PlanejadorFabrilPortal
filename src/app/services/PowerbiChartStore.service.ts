import { from, Observable, Subject, tap } from "rxjs";
import { inject, Injectable, signal } from "@angular/core";
import { PowerbiDataset } from "../widgets/powerbi-chart/@core/models/PowerbiDataset";
import { PbIndexApiService } from "./PbIndexApi.service";
import { SignalStore } from "@/@core/abstract/SignalStore.abstract";

@Injectable({
    providedIn: 'root'
})
export class PowerBIChartsStoreServices extends SignalStore<PowerbiDataset[]> {
    datasets: PowerbiDataset[] = [];
    private datasetsSubject: Subject<PowerbiDataset[]> = new Subject<PowerbiDataset[]>();
    pickedDataset?: PowerbiDataset;
    
    // Buffer global de gráficos carregados para persistência entre navegações
    bufferChart = signal<PowerbiDataset[]>([]);

    api = inject(PbIndexApiService);

    refresh(): Observable<PowerbiDataset[]> {
        const a$ = this.api.listDataset(localStorage.getItem('urnick') as string | undefined)
            .pipe(
                tap(
                    dt => {
                        console.log(dt)
                        this.set(dt)
                    }
                )
            )
        return a$;
    }

    async getDatasets(): Promise<PowerbiDataset[]> {
        return this.item() ?? [];
    }

    addToBuffer(chart: PowerbiDataset) {
        const current = this.bufferChart();
        if (!current.some(c => c.PowerbiDatasetsID === chart.PowerbiDatasetsID)) {
            this.bufferChart.set([...current, chart]);
        }
    }

    override resetStore(): void {
        super.resetStore();
        this.bufferChart.set([]);
    }
}