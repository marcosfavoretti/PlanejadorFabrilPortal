import { FabricaResponseDto } from '@/api';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { FabricaService } from '@/app/services/Fabrica.service';
import { FabricaMudancaSyncService } from '@/app/services/FabricaMudancaSync.service';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { DatePipe } from '@angular/common';
import { Component, inject, input, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { Skeleton } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { tap } from 'rxjs';
import { CriacaoDePlanejamentoComponent } from '../criacao-de-planejamento/criacao-de-planejamento.component';

@Component({
  selector: 'app-fabrica-apresentacao-botoes',
  imports: [ConfirmPopupModule, TooltipModule],
  templateUrl: './fabrica-apresentacao-botoes.component.html',
  styleUrl: './fabrica-apresentacao-botoes.component.css'
})
export class FabricaApresentacaoBotoesComponent {
  ehPrincipal = input<boolean>(true);
  router = inject(Router);
  syncService = inject(FabricaMudancaSyncService);
  confirmPopUp = inject(ConfirmationService)
  popup = inject(LoadingPopupService)
  fabricaService = inject(FabricaService);
  contextoFabricaService = inject(ContextoFabricaService);

  abreCadastro(): void {
    this.popup.showPopUpComponent(CriacaoDePlanejamentoComponent);
  }

  requestMerge(): void {
    const merge$ = this.fabricaService.requestMergeFabrica({
      fabricaId: this.contextoFabricaService.item()?.fabricaId!
    })
      .pipe(
        tap(() =>
          this.router.navigate(['/', 'app'])
        )
      );
    this.popup.showWhile(merge$);
  }



  private restartFabrica(): void {
    const restart$ = this.fabricaService.restartFabrica({
      fabricaId: this.contextoFabricaService.getFabrica().fabricaId
    }).pipe(
      tap(() =>
        this.syncService
          .sync(this.contextoFabricaService.getFabrica().fabricaId)
      )
    );
    this.popup.showWhile(restart$);
  }

  private deletaFabrica(): void {
    const delete$ = this.fabricaService.removeFabrica({ fabricaId: this.contextoFabricaService.item()?.fabricaId! })
      .pipe(tap(() => this.router.navigate(['/'])));
    this.popup.showWhile(delete$);
  }

  private sincronizarFabrica(): void {
    const sync$ = this.fabricaService
      .sincronizaFabrica({ fabricaId: this.contextoFabricaService.item()?.fabricaId! })
      .pipe(
        tap(() => this.syncService.sync(this.contextoFabricaService.item()?.fabricaId!))
      );
    this.popup.showWhile(sync$);
  }

  confirmacaoDelecao(event: Event): void {
    this.confirmPopUp.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Quer mesmo apagar essa fábrica?',
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: 'cancelar',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'deletar',
        severity: 'danger'
      },
      accept: () => {
        this.deletaFabrica();
      },
      reject: () => {
        return;
      }
    });
  }



  confirmacaoSync(event: Event): void {
    this.confirmPopUp.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Quer mesmo sincronizar essa fábrica?',
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: 'cancelar',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Ok',
        severity: 'info'
      },
      accept: () => {
        this.sincronizarFabrica();
      },
      reject: () => {
        return;
      }
    });
  }

  confirmarRestartFabrica(event: Event): void {
    this.confirmPopUp.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Quer mesmo resetar a fábrica para a original?',
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: 'cancelar',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'confirmar',
        severity: 'warn'
      },
      accept: () => {
        this.restartFabrica();
      },
      reject: () => {
        return;
      }
    });
  }



  confirmacaoFork(event: Event): void {
    this.confirmPopUp.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Deseja mesmo fazer uma cópia dessa fábrica para edição?',
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'aceitar',
        severity: 'success'
      },
      accept: () => {
        this.forkFabrica();
      },
      reject: () => {
        return;
      }
    });
  }

  confirmacaoPullRequest(event: Event): void {
    this.confirmPopUp.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Deseja mesmo subter essa fábrica para o curso principal?',
      icon: 'pi pi-info-circle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'aceitar',
        severity: 'success'
      },
      accept: () => {
        this.requestMerge();
      },
      reject: () => {
        return;
      }
    });
  }

  forkFabrica(): void {
    const fork$ = this.fabricaService.forkFabrica()
      .pipe(
        tap((fabrica) => {
          this.contextoFabricaService.setFabrica(fabrica);
          this.router.navigate(['app', 'fabrica', `${fabrica.fabricaId}`])
        })
      );
    this.popup.showWhile(fork$)
  }

}
