import { AdicionarPlanejamentoDTO, AdicionarPlanejamentoDTOSetorEnum, ItemResDto, PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum, PedidoResponseDTO, PlanejamentoResponseDTO } from '@/api/planejador';
import { Component, Input, OnInit, signal, Signal } from '@angular/core';
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
  private itensAvaiable = signal<{ k: string, v: string }[]>([]);

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
    const item = JSON.parse(ev.item) as ItemResDto;
    const payload: AdicionarPlanejamentoDTO = {
      fabricaId: this.fabricaStore.getFabrica().fabricaId,
      item: item.Item,
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
    this.popup.showWhile(inserir$);
    // window.location.reload();
  }

  ngOnInit(): void {
    const pedidos$ = this.pedidoService.consultaPedido({
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
        data: pedidos.map(p => ({ k: JSON.stringify(p), v: `id: ${p.id} | codigo: ${p.codigo} | item: ${p.item.Item} ${p.item.tipo_item}` })),
        trigger: (input: string) => {
          const pedido = JSON.parse(input) as PedidoResponseDTO;
          this.pedidoService.consultaItensDoPedido({
            fabricaId: this.fabricaStore.item()!.fabricaId,
            pedidoId: pedido.id
          })
            .pipe(
              tap(res => {
                const op = res.map(p => ({ k: JSON.stringify(p), v: `item: ${p.Item} desc: ${p.tipo_item}` }))
                this.itensAvaiable.set(op)
                this.geraForms(pedidos)
              })
            ).subscribe()
        },

      },
      {
        label: 'Item',
        name: 'item',
        type: 'select',
        required: true,
        disable: false,
        data: this.itensAvaiable()
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
