import { FabricaResponseDto } from '@/api';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { FabricaService } from '@/app/services/Fabrica.service';
import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { tap } from 'rxjs';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { FabricaMudancaSyncService } from '@/app/services/FabricaMudancaSync.service';

@Component({
  selector: 'app-fabrica-apresentacao',
  imports: [DatePipe, ConfirmPopupModule, TooltipModule],
  providers: [ConfirmationService],
  templateUrl: './fabrica-apresentacao.component.html',
  styleUrl: './fabrica-apresentacao.component.css'
})
export class FabricaApresentacaoComponent implements OnInit {

  constructor(
    private fabricaService: FabricaService,
    private contextoFabricaService: ContextoFabricaService,
    private popup: LoadingPopupService,
    private router: Router,
    private syncService: FabricaMudancaSyncService,
    private confirmPopUp: ConfirmationService
  ) { }

  fabrica?: FabricaResponseDto

  setFabrica(fabrica: FabricaResponseDto): void {
    this.fabrica = fabrica;
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

  ngOnInit(): void {
    this.fabrica = this.contextoFabricaService.getFabrica();
    this.contextoFabricaService
      .subscribeFabricaChange((fabrica) => this.setFabrica(fabrica));
  }


  private restartFabrica(): void {
    const restart$ = this.fabricaService.restartFabrica({
      fabricaId: this.contextoFabricaService.getFabrica().fabricaId
    })
    this.popup.showWhile(restart$)
      .pipe(
        tap(() =>
          this.syncService.sync(this.contextoFabricaService.getFabrica().fabricaId))
      )
      .subscribe();
  }

  private deletaFabrica(): void {
    const delete$ = this.fabricaService.removeFabrica({ fabricaId: this.contextoFabricaService.item()?.fabricaId! }).pipe(tap(() => this.router.navigate(['/'])));
    this.popup.showWhile(delete$);
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
          this.router.navigate(['/', 'fabrica', `${fabrica.fabricaId}`])
        })
      );
    this.popup.showWhile(fork$)
  }

}
