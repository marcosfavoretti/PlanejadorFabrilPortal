import { AdicionarPlanejamentoDTO, AdicionarPlanejamentoDTOSetorEnum, PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum, PedidoResponseDTO, PlanejamentoResponseDTO } from '@/api';
import { Component, Input, OnInit } from '@angular/core';
import { DynamicField } from '../form-dinamico/@core/DynamicField';
import { FabricaService } from '@/app/services/Fabrica.service';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { tap } from 'rxjs';
import { FormDinamicoComponent } from '../form-dinamico/form-dinamico.component';
import { PedidoService } from '@/app/services/Pedido.service';
import { FabricaMudancaSyncService } from '@/app/services/FabricaMudancaSync.service';
@Component({
  selector: 'app-criacao-de-planejamento',
  imports: [FormDinamicoComponent],
  templateUrl: './criacao-de-planejamento.component.html',
  styleUrl: './criacao-de-planejamento.component.css'
})
export class CriacaoDePlanejamentoComponent implements OnInit {
  @Input() planejamento!: PlanejamentoResponseDTO;
  @Input() closeButtonFn!: () => void;

  formsFields: DynamicField[] = [];
  constructor(
    private pedidoService: PedidoService,
    private fabricaservice: FabricaService,
    private syncService: FabricaMudancaSyncService,
    private fabricaStore: ContextoFabricaService,
    private popup: LoadingPopupService
  ) { }

  efetivarCriacao(ev: any): void {
    const pedido = JSON.parse(ev.pedido);
    console.log(pedido)
    const payload: AdicionarPlanejamentoDTO = {
      fabricaId: this.fabricaStore.getFabrica().fabricaId,
      item: pedido.item,
      qtd: ev.quantidade,
      setor: ev.setor,
      pedidoId: pedido.id,
      dia: new Date(ev.dia)
    }
    const inserir$ = this.fabricaservice.adicionarPlanejamentoManual(payload).pipe(
      tap(() => {
        this.syncService.sync(this.fabricaStore.getFabrica().fabricaId);
        this.closeButtonFn();
      })
    );
    this.popup.showWhile(inserir$).subscribe();
    // window.location.reload();
  }

  ngOnInit(): void {
    const pedidos$ = this.pedidoService.getFabricaPrincipal({
      tipoConsulta: PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum.planejados
    })
      .pipe(
        tap(
          pedidos => this.geraForms(pedidos)
        )
      );
    this.popup.showWhile(pedidos$);
  }

  geraForms(pedidos: PedidoResponseDTO[]): void {
    this.formsFields = [
      {
        label: 'Pedido',
        name: 'pedido',
        type: 'select',
        required: true,
        disable: false,
        data: pedidos.map(p => ({ k: JSON.stringify(p), v: `id: ${p.id} | codigo: ${p.codigo} | item: ${p.item}` }))
      },
      {
        label: 'Setor',
        name: 'setor',
        type: 'select',
        data: Object.values(AdicionarPlanejamentoDTOSetorEnum).map(v => ({ v: v, k: v })),
        required: true,
        disable: false,
      },
      {
        label: 'Dia',
        name: 'dia',
        required: true,
        disable: false,
        type: 'date',

      },
      {
        label: 'Quantidade',
        name: 'quantidade',
        disable: false,
        required: true,
        type: 'number',
      },
    ]
  }
}
