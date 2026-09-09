import { IShutDown } from "@/@core/abstract/IShutDown";
import { IStartUp } from "@/@core/abstract/IStartUp";
import { inject, Injectable } from "@angular/core";
import { CentroDeCustoStoreService } from "./CentroDeCustoStore.service";

@Injectable({
    providedIn: 'root'
})
export class PontoStartUpService
implements IStartUp, IShutDown{
    cc = inject(CentroDeCustoStoreService)
    startUp(props?: unknown): void {
        this.cc.initialize().subscribe();
    }
    shutDown(): void {
        this.cc.resetStore();
    }
}