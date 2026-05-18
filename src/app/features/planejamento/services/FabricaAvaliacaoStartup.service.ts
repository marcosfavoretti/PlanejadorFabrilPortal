import { inject, Injectable } from "@angular/core";
import { FabricaService } from "./Fabrica.service";
import { IShutDown } from "@/@core/abstract/IShutDown";
import { IStartup } from "@/@core/abstract/IStartup";
import { FabricaAvaliacaoStoreService } from "./FabricaAvaliacaoStore.service";

@Injectable({
    providedIn: 'root'
})
export class FabricaAvaliacaoStartupService implements IShutDown, IStartup {

    fabricaAvaliacaoStore = inject(FabricaAvaliacaoStoreService);

    startup(): void {
        const flow$ = this.fabricaAvaliacaoStore.initialize();
        flow$.subscribe();
    }

    shutDown(): void {
        this.fabricaAvaliacaoStore.resetStore();
    }
}