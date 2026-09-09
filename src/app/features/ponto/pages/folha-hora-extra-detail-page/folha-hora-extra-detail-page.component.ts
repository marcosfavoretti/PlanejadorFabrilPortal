import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { LIDERES_ROLES } from '@/app/core/auth/role-groups';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { ResExtratoCustoFuncionarioHoraExtraDTO } from '@/api/relogio';
import {
  FOLHA_HE_STATUS_LABEL,
  FolhaHoraExtraAPIService,
  FolhaHoraExtraDetalhe,
  FolhaHoraExtraStatus,
  mapFolhaHoraExtraError,
} from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogService } from 'primeng/dynamicdialog';
import { MessagesModule } from 'primeng/messages';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastMessageOptions } from 'primeng/api';
import { FolhaHoraExtraApprovalDialogComponent } from '../../widgets/folha-hora-extra-approval-dialog/folha-hora-extra-approval-dialog.component';

@Component({
  selector: 'app-folha-hora-extra-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    MessagesModule,
    PanelModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './folha-hora-extra-detail-page.component.html',
  styleUrls: ['./folha-hora-extra-detail-page.component.css'],
  providers: [DialogService],
})
export class FolhaHoraExtraDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly folhaHoraExtraService = inject(FolhaHoraExtraAPIService);
  private readonly userStore = inject(UserstoreService);
  private readonly dialogService = inject(DialogService);

  protected readonly statusLabel = FOLHA_HE_STATUS_LABEL;
  protected folha: FolhaHoraExtraDetalhe | null = null;
  protected loading = false;
  protected messages: ToastMessageOptions[] = [];
  protected showCostDetails = false;
  private shouldPrintAfterLoad = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idFolha');
    this.shouldPrintAfterLoad = this.route.snapshot.queryParamMap.get('imprimir') === 'true';
    if (!id) {
      this.messages = [{ severity: 'error', summary: 'Erro', detail: 'ID da folha nao informado.' }];
      return;
    }
    this.loadFolha(id);
  }

  protected editFolha(): void {
    if (!this.folha || !this.canEdit()) {
      return;
    }
    this.router.navigate(['/ponto/he/editar', this.folha.id]);
  }

  protected printFolha(): void {
    document.body.classList.add('printing-folha-he');
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-folha-he');
    }, { once: true });
    requestAnimationFrame(() => window.print());
  }

  protected submitFolha(): void {
    if (!this.folha) {
      return;
    }
    this.folhaHoraExtraService.submitFolha(this.folha.id).subscribe({
      next: folha => {
        this.folha = folha;
        this.messages = [{ severity: 'success', summary: 'Sucesso', detail: 'Folha submetida para gerencia.' }];
      },
      error: err => this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }],
    });
  }

  protected openApprovalDialog(): void {
    if (!this.folha || !this.canApprove()) {
      return;
    }

    const ref = this.dialogService.open(FolhaHoraExtraApprovalDialogComponent, {
      header: 'Aprovar ou rejeitar folha',
      width: '480px',
      data: { folha: this.folha },
      closable: true,
    });

    ref.onClose.subscribe(result => {
      if (result?.updated) {
        this.goBackToList();
      }
    });
  }

  protected canEdit(): boolean {
    const roles = this.userStore.item()?.cargosLista ?? [];
    const canEdit = roles.includes('SUPORTE')
      || LIDERES_ROLES.some(role => roles.includes(role));
    return !!this.folha
      && ['RASCUNHO', 'REJEITADO_GERENCIA', 'REJEITADO_DIRETORIA'].includes(this.folha.status)
      && canEdit;
  }

  protected toggleCostDetails(): void {
    this.showCostDetails = !this.showCostDetails;
  }

  protected canSubmit(): boolean {
    return !this.userStore.item()?.cargosLista?.includes('SUPORTE')
      && !!this.folha
      && ['RASCUNHO', 'REJEITADO_GERENCIA', 'REJEITADO_DIRETORIA'].includes(this.folha.status);
  }

  protected canApprove(): boolean {
    if (!this.folha) {
      return false;
    }

    const roles = this.userStore.item()?.cargosLista ?? [];
    if (roles.includes(SetUserCargoDTOCargoEnum.ADMIN)) {
      return ['AGUARDANDO_GERENCIA', 'AGUARDANDO_DIRETORIA'].includes(this.folha.status);
    }

    return (
      (roles.includes('GERENTE') && this.folha.status === 'AGUARDANDO_GERENCIA') ||
      (roles.includes(SetUserCargoDTOCargoEnum.DIRETOR) && this.folha.status === 'AGUARDANDO_DIRETORIA')
    );
  }

  protected transporteLabel(funcionario: FolhaHoraExtraDetalhe['funcionarios'][number]): string {
    if (funcionario.transporte) {
      return funcionario.transporte === 'N/A' ? 'Nao' : funcionario.transporte;
    }

    return funcionario.precisaUber ? 'UBER' : 'Nao';
  }

  protected refeicaoLabel(funcionario: FolhaHoraExtraDetalhe['funcionarios'][number]): string {
    if (funcionario.refeicao) {
      return funcionario.refeicao === 'N/A' ? 'Nao' : funcionario.refeicao;
    }

    if (funcionario.marmitex) {
      return 'MARMITEX';
    }

    return funcionario.lanche ? 'LANCHE' : 'Nao';
  }

  protected justificativa(funcionario: FolhaHoraExtraDetalhe['funcionarios'][number], folha: FolhaHoraExtraDetalhe): string {
    return funcionario.justificativa || folha.justificativas?.[funcionario.matricula] || '-';
  }

  protected totalHE(funcionario: FolhaHoraExtraDetalhe['funcionarios'][number]): string {
    if (funcionario.totalHE) {
      return funcionario.totalHE;
    }

    const totalMinutes = this.totalMinutes(funcionario.inicioHE, funcionario.fimHE);
    return `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
  }

  protected formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0));
  }

  protected formatNumber(value: number | null | undefined, digits = 2): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number(value ?? 0));
  }

  protected extratoFuncionarios(): ResExtratoCustoFuncionarioHoraExtraDTO[] {
    return this.folha?.extratoCusto?.funcionarios ?? [];
  }

  protected getStatusSeverity(status: FolhaHoraExtraStatus): 'secondary' | 'info' | 'warn' | 'success' | 'danger' {
    switch (status) {
      case 'RASCUNHO': return 'secondary';
      case 'AGUARDANDO_GERENCIA': return 'info';
      case 'AGUARDANDO_DIRETORIA': return 'warn';
      case 'APROVADO': return 'success';
      case 'REJEITADO_GERENCIA':
      case 'REJEITADO_DIRETORIA':
        return 'danger';
    }
  }

  protected goBackToList(): void {
    this.router.navigate(['/ponto/he']);
  }

  private loadFolha(id: string): void {
    this.loading = true;
    this.folhaHoraExtraService.getFolhaById(id).subscribe({
      next: folha => {
        this.folha = folha;
        this.loading = false;
        if (this.shouldPrintAfterLoad) {
          this.shouldPrintAfterLoad = false;
          requestAnimationFrame(() => this.printFolha());
        }
      },
      error: err => {
        this.loading = false;
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
      },
    });
  }

  private totalMinutes(inicio: string | null | undefined, fim: string | null | undefined): number {
    if (!inicio || !fim) {
      return 0;
    }

    const [inicioHora, inicioMinuto] = String(inicio).split(':').map(Number);
    const [fimHora, fimMinuto] = String(fim).split(':').map(Number);
    if ([inicioHora, inicioMinuto, fimHora, fimMinuto].some(Number.isNaN)) {
      return 0;
    }

    let inicioTotal = inicioHora * 60 + inicioMinuto;
    let fimTotal = fimHora * 60 + fimMinuto;
    if (fimTotal < inicioTotal) {
      fimTotal += 24 * 60;
    }

    return Math.max(fimTotal - inicioTotal, 0);
  }
}
