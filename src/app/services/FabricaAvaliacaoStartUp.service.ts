import { inject, Injectable } from "@angular/core";
import { FabricaService } from "./Fabrica.service";
import { IShutDown } from "@/@core/abstract/IShutDown";
import { IStartUp } from "@/@core/abstract/IStartUp";
import { FabricaAvaliacaoStoreService } from "./FabricaAvaliacaoStore.service";

@Injectable({
    providedIn: 'root'
})
export class FabricaAvaliacaoStartUpService implements IShutDown, IStartUp {

    fabricaAvaliacaoStore = inject(FabricaAvaliacaoStoreService);

    startUp(): void {
        const flow$ = this.fabricaAvaliacaoStore.initialize();
        flow$.subscribe();
    }

    shutDown(): void {
        this.fabricaAvaliacaoStore.resetStore();
    }
}