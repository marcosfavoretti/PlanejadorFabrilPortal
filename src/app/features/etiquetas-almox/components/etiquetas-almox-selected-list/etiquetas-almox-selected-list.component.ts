import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface EtiquetaAlmoxSelectedItem {
  item: string;
  den_item: string;
  quantity: number;
}

@Component({
  selector: 'app-etiquetas-almox-selected-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './etiquetas-almox-selected-list.component.html',
  styleUrl: './etiquetas-almox-selected-list.component.css'
})
export class EtiquetasAlmoxSelectedListComponent {
  @Input() items: EtiquetaAlmoxSelectedItem[] = [];
  @Output() increase = new EventEmitter<string>();
  @Output() decrease = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  protected trackByItem(_: number, item: EtiquetaAlmoxSelectedItem): string {
    return item.item;
  }
}
