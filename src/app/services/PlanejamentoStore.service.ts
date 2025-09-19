import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { PlanejamentoResponseDTO } from "@/api";
import { inject, Injectable } from "@angular/core";
import { FabricaService } from "./Fabrica.service";
import { Observable, tap } from "rxjs";
import { addDays, format, startOfDay } from "date-fns";

@Injectable({
    providedIn: 'root'
})
export class PlanejamentoStoreService extends SignalStore<PlanejamentoResponseDTO[]> {
    fabricaSevice = inject(FabricaService);
    DEFAULT_INIT_DATA = startOfDay(new Date());
    DEFAULT_END_DATA = addDays(startOfDay(new Date()), 30);

    setPlanejamentos(value: PlanejamentoResponseDTO[]): void {
        console.log('MUDOU O PLANEJADO');
        this.set(value);
    }


    refresh(fabricaId: string, dataIncial?: Date, dataFinal?: Date): Observable<PlanejamentoResponseDTO[]> {
        return this.fabricaSevice.getPlanejamentos({
            fabricaId: fabricaId,
            dataInicial: dataIncial || this.DEFAULT_INIT_DATA,
            dataFinal: dataFinal || this.DEFAULT_END_DATA
        })
            .pipe(
                tap(
                    plan => this.setPlanejamentos(plan)
                )
            );
    }
}