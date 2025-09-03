import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { TreeModule } from 'primeng/tree';
import { BadgeModule } from 'primeng/badge';
import { PedidoPlanejadosStoreService } from '@/app/services/PedidoPlanejadoStore.service';
import { FabricaService } from '@/app/services/Fabrica.service';
import { FabricaMudancaSyncService } from '@/app/services/FabricaMudancaSync.service';
import { tap } from 'rxjs';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: 'app-pedidos-planejados-tabela',
  imports: [
    TreeModule,
    BadgeModule,
    CommonModule,
    Tooltip
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

  treeData = this.pedidoStore.treeNodes; // signal computado

  ngOnInit(): void {
    const fabricaId = this.fabricaStore.getFabrica().fabricaId;
    this.pedidoStore.refreshPedidos(fabricaId).subscribe();
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
