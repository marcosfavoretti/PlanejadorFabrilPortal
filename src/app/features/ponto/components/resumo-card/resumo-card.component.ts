import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Card de resumo (rótulo + valor + detalhe opcional). Use `texto` para valores textuais longos. */
@Component({
  selector: 'app-resumo-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="rotulo">{{ label() }}</span>
    <strong [class.texto]="texto()">{{ valor() }}</strong>
    @if (detalhe()) {
      <small>{{ detalhe() }}</small>
    }
  `,
  styles: [`
    :host {
      background: var(--surface-card, #fff);
      border: 1px solid var(--surface-border, #e5e7eb);
      border-radius: .8rem;
      display: flex;
      flex-direction: column;
      gap: .2rem;
      min-width: 0;
      padding: .85rem 1rem;
    }
    .rotulo { color: #64748b; font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
    strong { color: #0f172a; font-size: 1.6rem; line-height: 1.2; }
    strong.texto { font-size: 1.05rem; overflow-wrap: anywhere; }
    small { color: #64748b; font-size: .75rem; }
  `],
})
export class ResumoCardComponent {
  readonly label = input.required<string>();
  readonly valor = input.required<string | number>();
  readonly detalhe = input<string | null>(null);
  readonly texto = input(false);
}
