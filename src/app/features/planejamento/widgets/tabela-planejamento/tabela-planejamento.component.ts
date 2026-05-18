import { TableModel } from '@/app/shared/components/table-dynamic/table.model';
import { Component, effect, inject, Input, OnInit } from '@angular/core';
import { FabricaService } from '@/app/features/planejamento/services/Fabrica.service';
import { ContextoFabricaService } from '@/app/features/planejamento/services/ContextoFabrica.service';
import { addDays, startOfDay } from 'date-fns';
import { PlanejamentoStoreService } from '@/app/features/planejamento/stores/planejamento.store';
import { CriacaoDePlanejamentoComponent } from '@/app/features/planejamento/widgets/criacao-de-planejamento/criacao-de-planejamento.component';
import { EdicaoDePlanejamentoPopUpComponent } from '@/app/features/planejamento/widgets/edicao-de-planejamento-pop-up/edicao-de-planejamento-pop-up.component';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';

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

  planejamentoEffect = effect(() => {
    this.loadTabela();
  });
  fabricaservice: FabricaService = inject(FabricaService);
  fabricaStore: ContextoFabricaService = inject(ContextoFabricaService);
  popup: LoadingPopupService = inject(LoadingPopupService);
  planejamento: PlanejamentoStoreService = inject(PlanejamentoStoreService);
  planejamentos = this.planejamento.item;

  public tabelaSchema!: TableModel;

  loadTabela(): void {
    const fabricaId = this.fabricaStore.item()?.fabricaId;
    if (!fabricaId) return;
    this.planejamento.initialize(fabricaId).subscribe();
  }

  ngOnInit(): void {
    this.tabelaSchema = {
      title: 'Planejamentos',
      paginator: true,
      columns: [
        {
          field: 'planejamentoId',
          alias: 'PlanejamentoId'
        },
        {
          field: 'pedido',
          alias: 'pedidoId'
        },
        {
          field: 'setor.nome',
          alias: 'setor'
        },
        {
          field: 'setor.codigo',
          alias: 'setorId'
        },
        {
          field: 'dia',
          isDate: true,
          alias: 'Dia',
        },
        {
          field: 'item.Item',
          alias: 'item'
        },
        {
          field: 'item.tipo_item',
          alias: 'desc'
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
  }

  private showEdicaoPopUP(row: any): void {
    this.popup.showPopUpComponent(EdicaoDePlanejamentoPopUpComponent, {
      planejamento: row
    });
  }
}
