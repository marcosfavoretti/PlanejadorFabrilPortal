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
  @Input() tipo: 'gerada' | 'reportada' = 'gerada';
  rotulo(periodo: string): string {
    if (this.dados?.agrupamento === 'ano') return periodo.slice(0, 4);
    if (this.dados?.agrupamento === 'mes')
      return periodo.slice(0, 7).split('-').reverse().join('/');
    if (periodo.includes('W')) return periodo;
    return periodo.slice(0, 10).split('-').reverse().join('/');
  }
  @Input() dados: IndicadoresSucata | null = null;
  get maximo(): number {
    return Math.max(
      1,
      ...(this.dados?.itens.map((item) => item.totalKg) ?? []),
    );
  }
  largura(totalKg: number): string {
    return `${Math.max(0, (totalKg / this.maximo) * 100)}%`;
  }
}
