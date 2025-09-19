import { PedidoPlanejadosStoreService } from '@/app/services/PedidoPlanejadoStore.service';
import { Component, inject } from '@angular/core';
import { SimpleCardComponent } from "../simple-card/simple-card.component";

@Component({
  selector: 'app-contador-divida',
  imports: [SimpleCardComponent],
  templateUrl: './contador-divida.component.html',
  styleUrl: './contador-divida.component.css'
})
export class ContadorDividaComponent {
  pedidosPlenejadosService = inject(PedidoPlanejadosStoreService);

  getData(): string | undefined {
    const dados = this.pedidosPlenejadosService.item();
    if (!dados) return;
    return String(dados.reduce((total, dado) => total += dado.dividas.reduce((total, b) => total += b.qtd, 0), 0));
  }
}
