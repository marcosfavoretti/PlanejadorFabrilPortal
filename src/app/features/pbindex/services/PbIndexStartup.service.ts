import { IShutDown } from "@/@core/abstract/IShutDown";
import { IStartup } from "@/@core/abstract/IStartup";
import { inject, Injectable } from "@angular/core";
import { UserstoreService } from "@/app/core/user/stores/user-store.service";
import { PbIndexApiService } from "./PbIndexApi.service";
import { PowerBIChartsStoreServices } from "./PowerbiChartStore.service";
import { PbIndexClientWs } from "@/@core/ws/PbIndex.client";

@Injectable({
    providedIn: 'root'
})
export class PbIndexStartup implements IStartup, IShutDown {
    api = inject(PbIndexApiService);
    chartStore = inject(PowerBIChartsStoreServices);
    ws = inject(PbIndexClientWs);
    userStore = inject(UserstoreService);

    startup(): void {
        this.userStore.initialize().subscribe({
            next: () => {
                this.ws.connect();
                this.chartStore.refresh().subscribe();
            },
            error: (err) => {
                console.error('[PbIndexStartup] Falha ao inicializar usuário:', err);
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
