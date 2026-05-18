import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import {CardModule} from "primeng/card"
@Component({
  selector: 'app-pop-up-submit-checklist',
  templateUrl: './pop-up-submit-checklist.component.html',
  styleUrls: ['./pop-up-submit-checklist.component.css'],
  standalone: true,
  imports: [CardModule, FormsModule]
})
export class PopUpSubmitChecklistComponent  {

  constructor(private dialogRef: DynamicDialogRef<PopUpSubmitChecklistComponent>) {} // Injetar DynamicDialogRef

  validForms(forms: NgForm) {
    if (forms.valid) {
      this.dialogRef.close({
        name : forms.controls['name'].value
      }); 
    }
    else{
      alert('nome inválido')
    }
  }


}
