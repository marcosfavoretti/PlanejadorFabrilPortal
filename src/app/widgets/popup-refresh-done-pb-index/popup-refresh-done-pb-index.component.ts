import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-popup-refresh-done-pb-index',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup-refresh-done-pb-index.component.html',
  styleUrl: './popup-refresh-done-pb-index.component.css'
})
export class PopupRefreshDonePbIndexComponent {
  @Input() describe: string = 'Atualização Concluída';
  @Input() closeButtonFn?: () => void;

  reloadPage(): void {
    window.location.reload();
  }

  quitPopUp(): void {
    if (this.closeButtonFn) {
      this.closeButtonFn();
    }
  }
}
