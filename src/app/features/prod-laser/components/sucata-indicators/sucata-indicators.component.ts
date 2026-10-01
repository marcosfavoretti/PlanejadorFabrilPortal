import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IndicadoresSucata } from '../../models/sucata.model';

@Component({
  selector: 'app-sucata-indicators',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sucata-indicators.component.html',
  styleUrl: './sucata-indicators.component.css',
})
export class SucataIndicatorsComponent {
  @Input() dados: IndicadoresSucata | null = null;
  get maximo(): number { return Math.max(1, ...(this.dados?.itens.map((item) => item.totalKg) ?? [])); }
  largura(totalKg: number): string { return `${Math.max(1, totalKg / this.maximo * 100)}%`; }
}
