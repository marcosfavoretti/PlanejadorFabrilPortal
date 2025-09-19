import { FabricaAvaliacaoStoreService } from '@/app/services/FabricaAvaliacaoStore.service';
import { TableModel } from '@/app/table-dynamic/@core/table.model';
import { Component, inject } from '@angular/core';
import { TableDynamicComponent } from "@/app/table-dynamic/table-dynamic.component";
import { Router } from '@angular/router';
import { FabricaService } from '@/app/services/Fabrica.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { tap } from 'rxjs';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-tabela-fabrica-para-avaliacao',
  imports: [TableDynamicComponent, ConfirmPopupModule, Toast],
  providers: [ConfirmationService, MessageService],
  templateUrl: './tabela-fabrica-para-avaliacao.component.html',
  styleUrl: './tabela-fabrica-para-avaliacao.component.css'
})
export class TabelaFabricaParaAvaliacaoComponent {

  fabricaAvaliacao = inject(FabricaAvaliacaoStoreService);
  fabricaService = inject(FabricaService);
  router = inject(Router);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);
  popup = inject(LoadingPopupService);

  confirmaMerge(mergeRequestId: number) {
    const merge$ = this.fabricaService.mergeFabrica({ mergeRequestId })
      .pipe(
        tap(
          () => {
            this.router.navigate(['/'])
            this.toastMessagePositive();
          }
        )
      );
    this.popup.showWhile(merge$);
  }

  toastMessagePositive() {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Fábrica principal alterada com sucesso!' });
  }

  toastMessageNegative() {
    this.messageService.add({ severity: 'error', summary: 'Ação de deleção', detail: 'Avalição apagada com sucesso!' });
  }

  schema: TableModel = {
    title: 'Pendente avaliação',
    columns: [
      {
        alias: 'conferir',
        field: '',
        isButton: true,
        button: {
          command: (row) => this.router.navigate([`/app/fabrica/${row.fabricaId}`]),
          icon: 'pi pi-eye',
          label: ''
        }
      },
      {
        alias: 'mergerId',
        field: 'mergeRequestId'
      },
      {
        alias: 'fabricaId',
        field: 'fabricaId'
      },
      {
        alias: 'autor',
        field: 'user.name',
      },
      {
        alias: 'criadaEm',
        field: 'criadaEm',
        isDate: true
      },
      {
        alias: 'aceitar',
        field: '',
        isButton: true,
        button: {
          command: (row, el) => {
            this.confirmationService.confirm({
              target: el.currentTarget as EventTarget,
              message: `Deseja aceitar a avaliação da fábrica ${row.fabricaId}?`,
              header: 'Confirmação',
              icon: 'pi pi-check-circle',
              rejectButtonProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
              },
              acceptButtonProps: {
                label: 'aceitar',
                severity: 'success'
              },
              accept: () => this.confirmaMerge(row.mergeRequestId),
              reject: () => { }
            })
          },
          icon: 'pi pi-check',
          label: ''
        }
      },
      {
        alias: 'negar',
        field: '',
        isButton: true,
        button: {
          command: (row, el) => {
            console.log(el)
            this.confirmationService.confirm({
              target: el.currentTarget as EventTarget,
              message: `Deseja negar a avaliação da fábrica ${row.fabricaId}?`,
              header: 'Confirmação',
              rejectButtonProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
              },
              acceptButtonProps: {
                label: 'apagar',
                severity: 'danger'
              },
              icon: 'pi pi-times-circle',
              accept: () => { this.toastMessageNegative(); alert('rejeitao ainda nao impl') },
              reject: () => { }
            })
          },
          icon: 'pi pi-times',
          label: ''
        }
      },

    ],
    totalize: false
  }
}
