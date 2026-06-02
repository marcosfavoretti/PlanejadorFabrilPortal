import { Component, input } from '@angular/core';
import { SimpleCardComponent } from '@/app/shared/components/simple-card/simple-card.component';

@Component({
  selector: 'app-pedido-aprovacao-resumo',
  standalone: true,
  imports: [SimpleCardComponent],
  templateUrl: './pedido-aprovacao-resumo.component.html',
  styleUrl: './pedido-aprovacao-resumo.component.css',
})
export class PedidoAprovacaoResumoComponent {
  total = input.required<number>();
  valorTotal = input.required<number>();

  protected get valorTotalFormatado(): string {
    return this.valorTotal().toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
}
