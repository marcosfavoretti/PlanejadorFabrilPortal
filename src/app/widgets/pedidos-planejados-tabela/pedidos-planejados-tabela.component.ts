import { Component, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { TreeModule } from 'primeng/tree';
import { BadgeModule } from 'primeng/badge';
import { PedidoPlanejadosStoreService } from '@/app/services/PedidoPlanejadoStore.service';
import { FabricaService } from '@/app/services/Fabrica.service';
import { FabricaMudancaSyncService } from '@/app/services/FabricaMudancaSync.service';
import { tap } from 'rxjs';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
@Component({
  selector: 'app-pedidos-planejados-tabela',
  imports: [
    TreeModule,
    BadgeModule,
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
  ],
  templateUrl: './pedidos-planejados-tabela.component.html',
  styleUrl: './pedidos-planejados-tabela.component.css'
})
export class PedidosPlanejadosTabelaComponent
  implements OnInit {

  pedidoStore = inject(PedidoPlanejadosStoreService);
  fabricaStore = inject(ContextoFabricaService);
  fabricaApi = inject(FabricaService);
  popup = inject(LoadingPopupService)
  resync = inject(FabricaMudancaSyncService);
  isEditable = input<boolean>(false);


  collapseAll() {
    this.expandedRows = {};
  }


  expandedRows: any = {};
  pedidoDetalhes: { [key: number]: any } = {};

  treeData = this.pedidoStore.treeNodes; 
  
  ngOnInit(): void {
    console.log(this.fabricaStore.getFabrica())
    const fabricaId = this.fabricaStore.getFabrica().fabricaId;
    this.pedidoStore.refresh(fabricaId)
      .subscribe();
  }

  toggleRow(pedido: any) {
    if (this.expandedRows[pedido.id]) {
      delete this.expandedRows[pedido.id];
    } else {
      this.expandedRows[pedido.id] = true;
      setTimeout(() => {
        this.pedidoDetalhes[pedido.id] = {
          dividas: 'R$ 1.200,00 em aberto',
          planejamentos: 'Entrega prevista para 15/09'
        };
      }, 800);
    }
  }

  desplanejarPedido(pedidoId: number): void {
    const replan$ = this.fabricaApi.desplanejamentoPedido({
      pedidoIds: [pedidoId],
      fabricaId: this.fabricaStore.item()?.fabricaId!
    }).pipe(
      tap(() => this.resync.sync(
        this.fabricaStore.item()?.fabricaId!
      ))
    );
    this.popup.showWhile(replan$);
  }

  replanejarPedido(pedidoId: number): void {
    const replan$ = this.fabricaApi.replanejamentoPedido({
      pedidoId,
      fabricaId: this.fabricaStore.item()?.fabricaId!
    }).pipe(
      tap(() => this.resync.sync(
        this.fabricaStore.item()?.fabricaId!
      ))
    );
    this.popup.showWhile(replan$);
  }
}
