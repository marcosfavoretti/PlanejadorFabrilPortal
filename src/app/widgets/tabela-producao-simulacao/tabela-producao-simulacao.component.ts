import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { PlanejamentoAPIService } from '../../services/PlanejamentoAPI.service';
import { format } from 'date-fns';
import { forkJoin, Observable, tap } from 'rxjs';
import { GetTabelaProducaoDiarioDTO, SalvarTabelaProducaoDiarioDTO } from '../../../api';
import { AsyncPipe } from '@angular/common';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { TabelaProducaoStoreService } from '../../services/TabelaProducaoStore.service';
import { TableDynamicComponent } from '../../table-dynamic/table-dynamic.component';
import { TableModel } from '../../table-dynamic/@core/table.model';

@Component({
  selector: 'app-tabela-producao-simulacao',
  imports: [TableDynamicComponent, AsyncPipe],
  templateUrl: './tabela-producao-simulacao.component.html',
  styleUrl: './tabela-producao-simulacao.component.css'
})
export class TabelaProducaoSimulacaoComponent implements OnInit, OnChanges {

  @Input('contextDate') contextDate!: Date;

  constructor(
    private api: PlanejamentoAPIService,
    private popup: LoadingPopupService,
    public tabelaProducaoStore: TabelaProducaoStoreService
  ) { }

  tabela$!: Observable<GetTabelaProducaoDiarioDTO[]>;
  tableModel!: TableModel

  onNewChangeOnTable(change: any) {
    this.tabelaProducaoStore.addTabelaProducaoPending({
      id: change.row.id,
      produzido: Number(change.checked)
    })
  }

  laodTable(): void {
    this.tableModel = {
      title: `Produção do dia ${this.contextDate.toLocaleDateString()}`,
      totalize: false,
      columns: [
        {
          alias: 'item',
          field: 'item'
        },
        {
          alias: 'setor',
          field: 'setor'
        }, {
          alias: 'planejado',
          field: 'planejamento'
        },
        {
          alias: 'produzido',
          field: 'produzido',
          isInputText: true
        },
      ]
    }
  }

  submitChanges(): void {
    const changes: SalvarTabelaProducaoDiarioDTO[] = this.tabelaProducaoStore.getAllTableProducaoPending();
    const observableArr = changes.map(c => this.api.requestSaveTable(c));
    const batch$ = forkJoin(observableArr).pipe((tap(() => this.tabelaProducaoStore.clear())));
    this.popup.showWhile(batch$);
  }

  refreshInformations(): void {
    this.tabela$ = this.api.requestTabelaProducao({
      endDate: format(this.contextDate, 'dd/MM/yyyy'),
      startDate: format(this.contextDate, 'dd/MM/yyyy')
    })
      .pipe(
        tap(table =>
          table.map(t => t.produzido = this.tabelaProducaoStore.getTableProducaoPending(t.id)?.produzido || t.produzido))
      )
    this.laodTable();
    this.popup.showWhile(this.tabela$)
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.refreshInformations();
  }

  ngOnInit(): void {
    this.refreshInformations();
  }
}
