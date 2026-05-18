import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { PlanejamentoAPIService } from '@/app/features/planejamento/services/planejamento-api.service';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';

@Component({
  selector: 'app-produzidos-entre-setores',
  imports: [TableDynamicComponent, AsyncPipe],
  templateUrl: './produzidos-entre-setores.component.html',
  styleUrl: './produzidos-entre-setores.component.css'
})
export class ProduzidosEntreSetoresComponent implements OnInit {
  mercado$!: Observable<unknown>;

  constructor(
    private popup: LoadingPopupService,
    private planejamento: PlanejamentoAPIService) { }
  tabelModel: TableModel = {
    title: 'Producao entre Setores',
    totalize: false,
    paginator: false,
    ghostControll: [
      {
        color: 'orange',
        field: 'operacao',
        ifValueEqual: '00017',
        desc: 'Lixa'
      },
      {
        color: 'orange',
        field: 'operacao',
        ifValueEqual: '00015',
        desc: 'Solda'
      },
      {
        color: 'gray',
        field: 'operacao',
        ifValueEqual: '00035',
        desc: 'Banho'
      },
      {
        color: 'white',
        field: 'operacao',
        ifValueEqual: '00050',
        desc: 'Pintura Liq'
      },
      {
        color: 'green',
        field: 'operacao',
        ifValueEqual: '00025',
        desc: 'Montagem'
      }
    ],
    columns: [
      {
        alias: 'dia',
        field: 'dia',
        isDate: true,
        toTotalize: false
      },
      {
        alias: 'item',
        field: 'item'
      },
      {
        alias: 'operacao',
        field: 'operacao'
      },
      {
        alias: 'planejado',
        field: 'planejado'
      },
      {
        alias: 'produzido',
        field: 'produzido'
      },
      {
        alias: 'qtdmercado',
        field: 'qtdmercado'
      }
    ]
  }
  setorMercado() {
    this.planejamento.requestMercado()
  }

  refresh() {
    this.mercado$ = this.planejamento.requestMercado();
  }

  ngOnInit(): void {
    this.refresh();
  }
}
