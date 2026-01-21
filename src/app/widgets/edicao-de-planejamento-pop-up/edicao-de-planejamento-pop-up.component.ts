import { PlanejamentoResponseDTO } from '@/api/planejador';
import { Component, Input, OnInit } from '@angular/core';
import { FormDinamicoComponent } from '../form-dinamico/form-dinamico.component';
import { DynamicField } from '../form-dinamico/@core/DynamicField';
import { FabricaService } from '@/app/services/Fabrica.service';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { tap } from 'rxjs';
import { Tabs, TabsClasses, TabsModule } from 'primeng/tabs';
import { DatePipe } from '@angular/common';
import { PlanejamentoStoreService } from '@/app/services/PlanejamentoStore.service';
import { FabricaMudancaSyncService } from '@/app/services/FabricaMudancaSync.service';

@Component({
  selector: 'app-edicao-de-planejamento-pop-up',
  imports: [
    TabsModule,
    DatePipe,
    FormDinamicoComponent
  ],
  templateUrl: './edicao-de-planejamento-pop-up.component.html',
  styleUrl: './edicao-de-planejamento-pop-up.component.css'
})
export class EdicaoDePlanejamentoPopUpComponent
  implements OnInit {
  @Input() planejamento!: PlanejamentoResponseDTO;
  @Input() closeButtonFn!: () => void;


  formsFields: DynamicField[] = [];
  
  constructor(
    private fabricaservice: FabricaService,
    private fabricaStore: ContextoFabricaService,
    private popup: LoadingPopupService,
    private syncService: FabricaMudancaSyncService
  ) { }

  atualizaPlanejamento(ev: any): void {
    const payload = {
      fabricaId: this.fabricaStore.getFabrica().fabricaId,
      planejamendoId: this.planejamento.planejamentoId,
      qtd: ev.quantidade,
      dia: new Date(ev.dia)
    }
    const atualizar$ = this.fabricaservice
      .atualizar(payload).pipe(
        tap(
          () => {
            this.syncService.sync(payload.fabricaId);
            this.closeButtonFn()
          }
        )
      )
    this.popup.showWhile(atualizar$);
  }

  removePlanejamento(): void {
    const fabricaId = this.fabricaStore.getFabrica().fabricaId;
    const remocao$ = this.fabricaservice.removerPlanejamento({
      fabricaId: fabricaId,
      planejamentoId: this.planejamento.planejamentoId
    }).pipe(
      tap(() => {
        this.syncService.sync(fabricaId);
        this.closeButtonFn();
      })
    );
    this.popup.showWhile(remocao$);
  }

  ngOnInit(): void {
    this.formsFields = [
      {
        label: 'Pedido',
        name: 'pedido',
        type: 'text',
        disable: true,
        defaultValue: this.planejamento.pedido
      },
      {
        label: 'Item',
        name: 'item',
        disable: true,
        type: 'text',
        defaultValue: this.planejamento.item.Item,
        required: true
      },
      {
        label: 'Setor',
        name: 'setor',
        type: 'text',
        disable: true,
        defaultValue: this.planejamento.setor.nome
      },

      {
        label: 'Dia',
        name: 'dia',
        disable: false,
        type: 'date',
        defaultValue: this.planejamento.dia
      },
      {
        label: 'Quantidade',
        name: 'quantidade',
        disable: false,
        type: 'number',
        defaultValue: this.planejamento.qtd
      },
    ]
  }
}
