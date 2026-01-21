import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { computed, inject, Injectable } from "@angular/core";
import { FabricaService } from "./Fabrica.service";
import { ConsutlarFabricaDTO, MudancasResDto, MudancasResDtoMudancaEnum } from "@/api/planejador";
import { catchError, Observable, tap } from "rxjs";
import { ContextoFabricaService } from "./ContextoFabrica.service";

type MudancaLog = MudancasResDto & {
    log: string
}

@Injectable({
    providedIn: 'root'
})
export class FabricaMudancaStore
    extends SignalStore<MudancasResDto[]> {
    api = inject(FabricaService);
    contextStore = inject(ContextoFabricaService);

    logMudancas = computed<MudancaLog[] | undefined>(() => {
        const applyPrefix = (mud: MudancasResDto) => {
            switch (mud.mudanca) {
                case MudancasResDtoMudancaEnum.ATUALIZACAO:
                    return { ...mud, log: `<-/+>${mud.entidade}: ${mud.valorAntigo}->${mud.valorNovo}` }
                case MudancasResDtoMudancaEnum.REMOÇÃO:
                    return { ...mud, log: `-${mud.entidade}: ${mud.valorAntigo}` }
                case MudancasResDtoMudancaEnum.INSERÇÃO:
                    return { ...mud, log: `+${mud.entidade}: ${mud.valorNovo}` }
            }
        }
        return this.item()?.map(applyPrefix) as MudancaLog[];
    })

    override refresh(): Observable<unknown> {
        return this.api.getMudancas({ fabricaId: this.contextStore.item()?.fabricaId! })
            .pipe(
                tap(
                    plan => this.set(plan)
                ),
                catchError(
                    (err) => {
                        console.error(err);
                        this.initialized = false;
                        return [];
                    }
                )
            );
    }

    override onGlobalInputFilterApplied(filter: string | undefined): void {
        return;
    }
}