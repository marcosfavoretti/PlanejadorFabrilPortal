import { IShutDown } from "@/@core/abstract/IShutDown";
import { IStartUp } from "@/@core/abstract/IStartUp";
import { inject, Injectable } from "@angular/core";
import { PbIndexApiService } from "./PbIndexApi.service";
import { PowerBIChartsStoreServices } from "./PowerbiChartStore.service";
import { PbIndexClientWs } from "@/@core/ws/PbIndex.client";
import { UserstoreService } from "./userstore.service";

@Injectable({
    providedIn: 'root'
})
export class PbIndexStartUp implements IStartUp, IShutDown {
    api = inject(PbIndexApiService);
    chartStore = inject(PowerBIChartsStoreServices);
    ws = inject(PbIndexClientWs);
    userStore = inject(UserstoreService);

    startUp(): void {
        this.userStore.initialize().subscribe({
            next: () => {
                this.ws.connect();
                this.chartStore.refresh().subscribe();
            },
            error: (err) => {
                console.error('[PbIndexStartUp] Falha ao inicializar usuário:', err);
                // Mesmo com erro tenta conectar caso o user já esteja lá
                this.ws.connect();
                this.chartStore.refresh().subscribe();
            }
        });
    }

    shutDown(): void {
        this.ws.disconnect();
        this.chartStore.resetStore();
    }
}