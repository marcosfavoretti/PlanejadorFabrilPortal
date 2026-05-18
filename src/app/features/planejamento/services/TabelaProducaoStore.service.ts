import { Injectable } from "@angular/core";
import { SalvarTabelaProducaoDiarioDTO } from "../../api";
@Injectable({ providedIn: 'root' })
export class TabelaProducaoStoreService {
    pendingToSync: SalvarTabelaProducaoDiarioDTO[] = [];

    addTabelaProducaoPending(tabela: SalvarTabelaProducaoDiarioDTO): void {
        if (this.pendingToSync.map(p => p.id).includes(tabela.id)) {
            this.pendingToSync.filter(t => t.id === tabela.id)
                .map(t => t.produzido = tabela.produzido);
            return;
        }
        this.pendingToSync.push(tabela);
        console.log(this.pendingToSync)
    }

    clear(): void {
        console.log('tudo apagado')
        this.pendingToSync = [];
    }

    checkAlteracao(): number {
        return this.pendingToSync.length
    }

    getAllTableProducaoPending(): SalvarTabelaProducaoDiarioDTO[] {
        return this.pendingToSync;
    }
    getTableProducaoPending(tabelaId: number): SalvarTabelaProducaoDiarioDTO | undefined {
        return this.pendingToSync.find(p => p.id === tabelaId);
    }
}