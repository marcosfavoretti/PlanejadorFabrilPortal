import { TableModel } from '@/app/table-dynamic/@core/table.model';
import { Component, inject, Input, OnInit } from '@angular/core';
import { TableDynamicComponent } from "../../table-dynamic/table-dynamic.component";
import { FabricaService } from '@/app/services/Fabrica.service';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { FabricaControllerConsultaPlanejamentosMethodQueryParams, PlanejamentoResponseDTO } from '@/api';
import { addDays, format, startOfDay } from 'date-fns';
import { tap } from 'rxjs';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { EdicaoDePlanejamentoPopUpComponent } from '../edicao-de-planejamento-pop-up/edicao-de-planejamento-pop-up.component';
import { CriacaoDePlanejamentoComponent } from '../criacao-de-planejamento/criacao-de-planejamento.component';
import { PlanejamentoStoreService } from '@/app/services/PlanejamentoStore.service';

@Component({
  selector: 'app-tabela-planejamento',
  imports: [TableDynamicComponent],
  templateUrl: './tabela-planejamento.component.html',
  styleUrl: './tabela-planejamento.component.css'
})
export class TabelaPlanejamentoComponent implements OnInit {
  @Input() estrategia: 'editavel' | 'estatico' = 'estatico';
  @Input() dataInicial: Date = startOfDay(new Date());
  @Input() dataFinal: Date = addDays(startOfDay(new Date()), 30);

  //
  /**
   * injecoes de dependencia
   */
  fabricaservice: FabricaService = inject(FabricaService);
  fabricaStore: ContextoFabricaService = inject(ContextoFabricaService);
  popup: LoadingPopupService = inject(LoadingPopupService);
  planejamento: PlanejamentoStoreService = inject(PlanejamentoStoreService);
  //
  planejamentos = this.planejamento.item;

  public tabelaSchema!: TableModel;
  //\\//

  loadTabela(fabricaId: string): void {
    const planejamentos$ = this.planejamento.refreshPlanejamentos(fabricaId);
    this.popup.showWhile(planejamentos$);
  }

  abreCadastro(): void {
    this.popup.showPopUpComponent(CriacaoDePlanejamentoComponent);
  }

  ngOnInit(): void {
    this.tabelaSchema = {
      title: 'Planejamentos',
      paginator: true,
      columns: [
        {
          field: 'planejamentoId',
          alias: '_id'
        },
        {
          field: 'dia',
          alias: 'dia',
          isDate: true
        },
        {
          field: 'pedido',
          alias: 'pedido'
        },
        {
          field: 'item',
          alias: 'item'
        },
        {
          field: 'setor',
          alias: 'setor'
        },
        {
          field: 'qtd',
          alias: 'qtd',
        },
      ],
      totalize: false
    };
    this.estrategia === 'editavel' && (this.tabelaSchema.columns.unshift({
      field: '',
      alias: '',
      isButton: true,
      button: {
        command: (row) => this.showEdicaoPopUP(row),
        icon: 'pi pi-ellipsis-v',
        label: ''
      },
    }));

    this.fabricaStore.subscribeFabricaChange(
      (fabrica) =>
        this.loadTabela(fabrica.fabricaId)
    );

  }

  private showEdicaoPopUP(row: any): void {
    this.popup.showPopUpComponent(EdicaoDePlanejamentoPopUpComponent, {
      planejamento: row
    })
  }

}

