import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-sucata-resumo-card',
  standalone: true,
  template: '<article class="summary-card"><div class="summary-icon" [class]="\'summary-icon \' + tone"><i class="pi" [class]="\'pi \' + icon"></i></div><div class="summary-label">{{ title }}</div><div class="summary-value">{{ value }}</div><div class="summary-footnote">{{ detail }}</div></article>',
  styles: [`.summary-card{min-width:0;padding:1rem 1.05rem;border:1px solid #e2e8f0;border-radius:.85rem;background:#fff}.summary-icon{display:grid;width:2.15rem;height:2.15rem;place-items:center;margin-bottom:.8rem;border-radius:.65rem}.summary-icon.blue{color:#2563eb;background:#eff6ff}.summary-icon.green{color:#15803d;background:#f0fdf4}.summary-icon.amber{color:#b45309;background:#fffbeb}.summary-icon.violet{color:#7c3aed;background:#f5f3ff}.summary-label{color:#64748b;font-size:.7rem;font-weight:750;letter-spacing:.055em;text-transform:uppercase}.summary-value{margin-top:.2rem;color:#0f172a;font-size:1.35rem;font-weight:800;font-variant-numeric:tabular-nums}.summary-footnote{margin-top:.1rem;color:#94a3b8;font-size:.72rem}`],
})
export class SucataResumoCardComponent {
  @Input() title = '';
  @Input() value = '—';
  @Input() detail = '';
  @Input() icon = 'pi-chart-bar';
  @Input() tone = 'blue';
}
