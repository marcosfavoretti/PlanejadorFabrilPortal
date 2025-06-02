import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { VirtaulDateAPIService } from "./VirutalDateAPI.service";
import { virtualDateControllerHandleDateMethodPathParamsParamEnum, VirtualDateControllerHandleDateMethodPathParamsParamEnum } from "../../api";

@Injectable({ providedIn: 'root' })
export class VirtualDateStoreService {
    private currentDateSubject = new BehaviorSubject<Date | null>(null);

    constructor(private api: VirtaulDateAPIService) {
        this.loadCurrentDate(); // Carrega a data ao iniciar
    }

    loadCurrentDate(): void {
        this.api.requestCurrent()
            .pipe(tap(date => this.currentDateSubject.next(new Date(date))))
            .subscribe();
    }

    /**
     * Retorna observable da data atual.
     */
    getDate$(): Observable<Date | null> {
        return this.currentDateSubject.asObservable();
    }

    /**
     * Retorna o valor atual da data (não reativo).
     */
    getDateSnapshot(): Date | null {
        return this.currentDateSubject.getValue();
    }

    /**
     * Avança a data virtual.
     */
    nextDate(): void {
        this.handleChange(virtualDateControllerHandleDateMethodPathParamsParamEnum.proxima);
    }

    /**
     * Retrocede a data virtual.
     */
    lastDate(): void {
        this.handleChange(virtualDateControllerHandleDateMethodPathParamsParamEnum.anterior);
    }

    /**
     * Atualiza o estado com nova data a partir da API.
     */
    private handleChange(param: VirtualDateControllerHandleDateMethodPathParamsParamEnum): void {
        this.api.requestHandle(param)
            .pipe(tap(date => this.currentDateSubject.next(new Date(date))))
            .subscribe();
    }
}
