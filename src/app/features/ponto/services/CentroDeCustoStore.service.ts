import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { ResCentroDeCustoDTO } from "@/api/relogio";
import { inject, Injectable } from "@angular/core";
import { from, Observable, tap } from "rxjs";
import { FuncionariosAPIService } from "./FuncionariosAPI.service";

@Injectable({
    providedIn: 'root'
})
export class CentroDeCustoStoreService extends SignalStore<ResCentroDeCustoDTO[]> {
    private readonly funcionarioAPI = inject(FuncionariosAPIService);
    override refresh(): Observable<unknown> {
        const cc$ = this.funcionarioAPI.getCentroDeCusto()
            .pipe(
                tap(
                    cc => this.set(cc)
                )
            );
        return cc$;
    }
}