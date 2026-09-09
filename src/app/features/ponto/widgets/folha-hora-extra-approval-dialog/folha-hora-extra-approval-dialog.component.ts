import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  FOLHA_HE_STATUS_LABEL,
  FolhaHoraExtraAPIService,
  FolhaHoraExtraResumo,
  mapFolhaHoraExtraError,
} from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessagesModule } from 'primeng/messages';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastMessageOptions } from 'primeng/api';

@Component({
  selector: 'app-folha-hora-extra-approval-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    MessagesModule,
    TagModule,
    TextareaModule,
  ],
  templateUrl: './folha-hora-extra-approval-dialog.component.html',
  styleUrls: ['./folha-hora-extra-approval-dialog.component.css'],
})
export class FolhaHoraExtraApprovalDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly folhaHoraExtraService = inject(FolhaHoraExtraAPIService);
  private readonly ref = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);

  protected readonly statusLabel = FOLHA_HE_STATUS_LABEL;
  protected folha!: FolhaHoraExtraResumo;
  protected loading = false;
  protected messages: ToastMessageOptions[] = [];

  protected readonly rejectionForm = this.fb.group({
    motivo: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit(): void {
    this.folha = this.config.data?.folha as FolhaHoraExtraResumo;
  }

  protected approve(): void {
    this.loading = true;
    this.folhaHoraExtraService.approveFolha(this.folha.id).subscribe({
      next: folha => this.ref.close({ updated: true, folha }),
      error: err => {
        this.loading = false;
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
      },
    });
  }

  protected reject(): void {
    if (this.rejectionForm.invalid) {
      this.rejectionForm.markAllAsTouched();
      this.messages = [{ severity: 'error', summary: 'Erro', detail: 'Informe o motivo da rejeicao.' }];
      return;
    }

    this.loading = true;
    this.folhaHoraExtraService.rejectFolha(this.folha.id, this.rejectionForm.controls.motivo.value ?? '').subscribe({
      next: folha => this.ref.close({ updated: true, folha }),
      error: err => {
        this.loading = false;
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
      },
    });
  }

  protected cancel(): void {
    this.ref.close();
  }
}
