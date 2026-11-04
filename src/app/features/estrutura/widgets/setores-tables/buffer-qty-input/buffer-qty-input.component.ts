import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type QtyState = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-buffer-qty-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (prefixo()) { <span class="pre" aria-hidden="true">{{ prefixo() }}.</span> }
    <input class="qty" type="number" inputmode="numeric" min="0" max="99" step="1"
      [class.qty--saving]="state() === 'saving'" [class.qty--saved]="state() === 'saved'"
      [class.qty--error]="state() === 'error'"
      [attr.aria-label]="label()" [attr.aria-invalid]="state() === 'error'" [attr.aria-busy]="state() === 'saving'"
      [value]="value()" (change)="onChange($event)" (focus)="$any($event.target).select()" />
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: .25rem; }
    .pre { font-size: .75rem; font-weight: 700; color: #6c757d; }
    .qty { width: 3.5rem; min-height: 2.25rem; text-align: center; font-variant-numeric: tabular-nums; font-weight: 600;
      border: 1px solid #ced4da; border-radius: .5rem; background: #fff; color: #212529; -moz-appearance: textfield; appearance: textfield;
      transition: border-color .15s, box-shadow .15s, background-color .15s; }
    .qty::-webkit-inner-spin-button, .qty::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    .qty:hover { border-color: #adb5bd; }
    .qty:focus-visible { outline: none; border-color: #00a77f; box-shadow: 0 0 0 3px rgba(0, 167, 127, .25); }
    .qty--saving { background: #f1f3f5; color: #6c757d; }
    .qty--saved { border-color: #198754; background: #f0fbf5; }
    .qty--error { border-color: #dc3545; background: #fff5f5; }
    @media (pointer: coarse) { .qty { min-height: 2.75rem; width: 4rem; font-size: 1rem; } }
    @media (prefers-reduced-motion: reduce) { .qty { transition: none; } }
  `,
})
export class BufferQtyInputComponent {
  readonly value = input.required<number>();
  readonly label = input.required<string>();
  readonly prefixo = input<string>('');
  readonly state = input<QtyState>('idle');
  readonly commit = output<number>();

  onChange(e: Event): void {
    const raw = (e.target as HTMLInputElement).value;
    if (raw === '') return; // mesmo comportamento anterior: vazio não salva
    this.commit.emit(Number(raw));
  }
}
