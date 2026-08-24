import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** Campo reutilizável que exibe partcodes no formato XX-XXX-... . */
@Component({
  selector: 'app-partcode-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './partcode-input.component.html',
  styleUrl: './partcode-input.component.css',
})
export class PartcodeInputComponent {
  @Input() value = '';
  @Input() name = 'partcode';
  @Input() inputId = 'partcode-input';
  @Input() placeholder = 'Partcode';
  @Output() valueChange = new EventEmitter<string>();

  update(value: string): void {
    this.valueChange.emit(this.format(value));
  }

  private format(value: string): string {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized.length <= 2) return normalized;
    if (normalized.length <= 5) return `${normalized.slice(0, 2)}-${normalized.slice(2)}`;
    return `${normalized.slice(0, 2)}-${normalized.slice(2, 5)}-${normalized.slice(5)}`;
  }
}
