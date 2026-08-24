import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BarcodeScannerInputComponent } from '@/app/shared/components/barcode-scanner-input/barcode-scanner-input.component';

export type ChecklistSubmission = {
  name: string;
  orderNum?: string;
};

@Component({
  selector: 'app-pop-up-submit-checklist',
  templateUrl: './pop-up-submit-checklist.component.html',
  styleUrls: ['./pop-up-submit-checklist.component.css'],
  standalone: true,
  imports: [CardModule, FormsModule, ConfirmPopupModule, BarcodeScannerInputComponent],
  providers: [ConfirmationService],
})
export class PopUpSubmitChecklistComponent {
  name = '';
  orderNum = '';
  allowOrderInput = true;
  linkedOrderNum = '';

  constructor(
    private dialogRef: DynamicDialogRef,
    config: DynamicDialogConfig,
    private confirmationService: ConfirmationService,
  ) {
    this.linkedOrderNum = config.data?.linkedOrderNum?.trim() || '';
    this.allowOrderInput = !this.linkedOrderNum;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  validForms(form: NgForm, event: Event): void {
    const name = this.name.trim();
    if (!form.valid || !name) {
      return;
    }

    const orderNum = this.linkedOrderNum || this.orderNum.trim();
    const result: ChecklistSubmission = { name, orderNum: orderNum || undefined };
    if (!orderNum) {
      this.confirmationService.confirm({
        target: (event as SubmitEvent).submitter ?? event.currentTarget ?? undefined,
        message: 'Você pode enviar o checklist sem ordem, mas ele não ficará atrelado a nenhuma ordem para uso nos filtros.',
        icon: 'pi pi-exclamation-triangle',
        rejectButtonProps: {
          label: 'Cancelar',
          severity: 'secondary',
          outlined: true,
        },
        acceptButtonProps: {
          label: 'Enviar sem ordem',
          severity: 'warning',
        },
        accept: () => this.dialogRef.close(result),
      });
      return;
    }

    this.dialogRef.close(result);
  }
}
