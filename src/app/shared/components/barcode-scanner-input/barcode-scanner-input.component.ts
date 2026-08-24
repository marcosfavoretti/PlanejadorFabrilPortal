import { Component, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'primeng/dynamicdialog';
import { BarcodeScannerPopupComponent } from './barcode-scanner-popup.component';

export type BarcodeReaderType = 'all' | 'barcode' | 'qrcode' | 'datamatrix';

@Component({
  selector: 'app-barcode-scanner-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './barcode-scanner-input.component.html',
  styleUrl: './barcode-scanner-input.component.css',
})
export class BarcodeScannerInputComponent {
  @Input() value = '';
  @Input() name = 'barcodeValue';
  @Input() inputId = 'barcode-input';
  @Input() placeholder = 'Código de barras';
  /** Formatos aceitos pelo leitor: all, barcode, qrcode ou datamatrix. */
  @Input() readerType: BarcodeReaderType = 'all';
  @Output() valueChange = new EventEmitter<string>();
  @Output() scanned = new EventEmitter<string>();

  constructor(
    private readonly dialog: DialogService,
    private readonly ngZone: NgZone,
  ) {}

  update(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
  }

  clear(): void {
    this.value = '';
    this.valueChange.emit('');
  }

  completeKeyboardScan(event: Event): void {
    const value = this.value.trim();
    if (!value || !this.scanned.observed) return;

    event.preventDefault();
    this.scanned.emit(value);
  }

  openScanner(): void {
    const ref = this.dialog.open(BarcodeScannerPopupComponent, {
      header: 'Ler código de barras',
      modal: true,
      width: 'min(92vw, 36rem)',
      closable: true,
      data: { readerType: this.readerType },
    });
    ref.onClose.subscribe((value?: string) => {
      if (!value) return;
      this.ngZone.run(() => {
        this.update(value);
        this.scanned.emit(value);
      });
    });
  }
}
