import { PedidoPlanejadosStoreService } from '@/app/services/PedidoPlanejadoStore.service';
import { Component, inject, OnInit } from '@angular/core';
import { SimpleCardComponent } from "../simple-card/simple-card.component";

@Component({
  selector: 'app-contador-atraso',
  imports: [SimpleCardComponent],
  templateUrl: './contador-atraso.component.html',
  styleUrl: './contador-atraso.component.css'
})
export class ContadorAtrasoComponent {
  pedidosPlenejadosService = inject(PedidoPlanejadosStoreService);

  getData(): string | undefined {
    const dados = this.pedidosPlenejadosService.item();
    if (!dados) return;
    return String(dados.reduce((total, dado) => total += dado.atrasos.reduce((total, b) => total += b.qtd, 0), 0));
  }
}
