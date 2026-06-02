import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-pedido-aprovacao-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedido-aprovacao-toolbar.component.html',
  styleUrl: './pedido-aprovacao-toolbar.component.css',
})
export class PedidoAprovacaoToolbarComponent {
  readonly total = input(0);
  readonly valorTotal = input(0);
  readonly pendingCount = input(0);
}
