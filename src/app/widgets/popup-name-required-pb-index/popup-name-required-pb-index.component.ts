import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { LocalStorageService } from '@/app/services/LocalStorage.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-popup-name-required-pb-index',
  imports: [
    CommonModule, FormsModule
  ],
  templateUrl: './popup-name-required-pb-index.component.html',
  styleUrl: './popup-name-required-pb-index.component.css'
})
export class PopupNameRequiredPbIndexComponent {

  constructor(
    private popUp: LoadingPopupService,
    private storage: LocalStorageService
  ) { }


  checkResponse(forms: NgForm): void {
    if (forms.valid) {
      this.storage.setInLocalStorage({
        key: 'urnick',
        value: forms.controls['name'].value
      });
      // this.popUp.close();
      window.location.reload();
    }
  }
}
