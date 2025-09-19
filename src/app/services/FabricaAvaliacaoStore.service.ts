import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { MergeRequestPendingDto } from "@/api";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, of, tap } from "rxjs";
import { FabricaService } from "./Fabrica.service";

@Injectable({
    providedIn: 'root'
})
export class FabricaAvaliacaoStoreService
    extends SignalStore<MergeRequestPendingDto[]> {
    fabricaAPI = inject(FabricaService);

    override refresh(): Observable<MergeRequestPendingDto[]> {
        return this.fabricaAPI.getMergeRequests()
            .pipe(
                tap(
                    res => this.set(res)
                ),
                catchError(
                    () => {
                        this.initialized = false;
                        throw new Error('Erro ao armazenar a fabrica');
                    }
                )
            )
    }
}