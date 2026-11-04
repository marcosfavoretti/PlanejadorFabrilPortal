import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ImageModule } from 'primeng/image';

@Component({
  selector: 'app-buffer-item-cell',
  standalone: true,
  imports: [ImageModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="img">
      @if (!image() || failed()) {
        <i class="pi pi-eye-slash sem-foto" title="Sem foto" aria-label="Sem foto"></i>
      } @else {
        <p-image [src]="image()" [preview]="true" appendTo="body" [alt]="item()"
          width="48" height="48" imageClass="img__el" (onImageError)="failed.set(true)" />
      }
    </span>
    <span class="txt">
      <strong class="cod">{{ item() }}</strong>
      @if (apelido()) { <span>{{ apelido() }}</span> }
      @if (itemCliente()) { <span class="cli">{{ itemCliente() }}</span> }
    </span>
  `,
  styles: `
    :host { display: flex; align-items: center; gap: .75rem; }
    .img { flex: none; width: 48px; height: 48px; border-radius: .5rem; background: #f1f3f5; overflow: hidden; display: block; }
    .img ::ng-deep .img__el { width: 48px; height: 48px; object-fit: contain; display: block; cursor: zoom-in; }
    .sem-foto { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #adb5bd; border: 1px dashed #ced4da; border-radius: .5rem; }
    .txt { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; color: #495057; }
    .cod { color: #212529; font-variant-numeric: tabular-nums; }
    .cli { font-size: .75rem; color: #6c757d; }
  `,
})
export class BufferItemCellComponent {
  readonly failed = signal(false);
  readonly image = input.required<string>();
  readonly item = input.required<string>();
  readonly apelido = input<string>('');
  readonly itemCliente = input<string>('');
}
