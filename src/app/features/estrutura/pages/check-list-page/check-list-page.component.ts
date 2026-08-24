import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ItemPainelComponent } from '@/app/features/estrutura/widgets/item-painel/item-painel.component';
import { FilterItens } from '@/@core/abstract/filter-item.abstract';
import { FilterCheckListActive } from '@/@core/filters/filter-by-checklist-ativo';
import { CheckBoxResponseEvent } from '@/app/features/estrutura/widgets/item-result-list-register-checklist/item-result-list-register-checklist.component';
import { ChecklistSubmission, PopUpSubmitChecklistComponent } from '@/app/features/estrutura/widgets/pop-up-submit-checklist/pop-up-submit-checklist.component';
import { Observable } from 'rxjs';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';
import { EstruturaContextService } from '@/app/features/estrutura/services/EstruturaContext.service';
import { PopUpResponseComponent } from '@/app/features/estrutura/widgets/pop-up-response/pop-up-response.component';
import { CacheService } from '@/@core/services/cache-service.service';

@Component({
  selector: 'app-check-list-page',
  templateUrl: './check-list-page.component.html',
  styleUrls: ['./check-list-page.component.css'],
  standalone: true,
  imports: [RouterLink, ItemPainelComponent]
})
export class CheckListPageComponent implements OnInit {
  @ViewChild('painel') painel!: ItemPainelComponent;
  filters: FilterItens[] = [
    new FilterCheckListActive()
  ]
  constructor(
    private dialog: DialogService, 
    private apiservice: EstruturaApiService, 
    private cacheservice: CacheService,
    private contextService: EstruturaContextService
  ) { }

  async handleRequests({ itempai, orderNum, event }: { itempai: string, orderNum?: string, event: CheckBoxResponseEvent[] }) {
    console.log(event);
    const linkedOrderNum = orderNum?.trim() || this.painel?.linkedOrderNum;
    const dialoInput$ = this.openDialog(linkedOrderNum);
    dialoInput$.subscribe(
      data => {
        this.submitLog(data, itempai, linkedOrderNum)
      }
    );
  }

  ngOnInit() {
  }

  public submitLog(submission: ChecklistSubmission, selectedItemFinal: string, orderNum?: string) {
    const tag = this.contextService.getTag();
    if (!tag) {
      this.popUpResponse({ msg: 'Selecione uma tag antes de submeter o checklist', stt: 'error' });
      return;
    }

    const effectiveOrderNum = orderNum || submission.orderNum;
    const payload = {
      SEPARADOR: submission.name,
      CHECKLIST_TAG: tag,
      ...(effectiveOrderNum ? { ORDER_NUM: effectiveOrderNum } : { COD_ITEM_FINAL: selectedItemFinal }),
    };

    this.apiservice.newChecklistLog(payload)
      .subscribe({
        error: (e) => this.popUpResponse({ msg: this.getSubmissionErrorMessage(e, Boolean(effectiveOrderNum)), stt: 'error' }),
        next: () => {
          this.clearChecklistCache(selectedItemFinal, tag);
          this.showProgressAndReload(tag, selectedItemFinal, effectiveOrderNum);
        },
      })
  }

  private showProgressAndReload(tag: string, codigoItem: string, orderNum?: string): void {
    this.apiservice.getChecklistProgress({
      tag,
      codigoItem: orderNum ? undefined : codigoItem,
      orderNum,
    }).subscribe({
      next: (progress: any) => {
        const total = progress?.totalSeparado ?? 0;
        const remaining = progress?.restante ?? 0;
        const excess = progress?.excedente ?? 0;
        const status = progress?.concluido ? 'Checklist concluído.' : 'Checklist ainda possui itens pendentes.';
        this.popUpResponse({
          msg: `Checklist enviado com sucesso. Separado: ${total}; restante: ${remaining}; excedente: ${excess}. ${status} A página será recarregada em breve...`,
          stt: 'confirm'
        }, false);
        this.reloadChecklistPage();
      },
      error: () => {
        this.popUpResponse({ msg: 'Checklist enviado com sucesso. A página será recarregada em breve...', stt: 'confirm' }, false);
        this.reloadChecklistPage();
      },
    });
  }

  private reloadChecklistPage(): void {
    window.setTimeout(() => window.location.reload(), 1500);
  }

  private getSubmissionErrorMessage(error: unknown, sentWithOrder: boolean): string {
    const response = error as any;
    const apiMessage = this.extractApiErrorMessage(response);
    const status = response?.response?.status ?? response?.status;
    if (status === 400) {
      const identifier = sentWithOrder ? 'ordem de produção' : 'código do produto';
      return apiMessage
        ? `Não foi possível validar a ${identifier}: ${apiMessage}`
        : `Não foi possível validar a ${identifier}. Confira o valor informado e tente novamente.`;
    }
    if (status === 404) {
      const identifier = sentWithOrder ? 'ordem de produção' : 'produto';
      return apiMessage
        ? `${identifier.charAt(0).toUpperCase()}${identifier.slice(1)} não encontrado: ${apiMessage}`
        : `${identifier.charAt(0).toUpperCase()}${identifier.slice(1)} não encontrado. Confira o valor informado.`;
    }
    if (status === 401 || status === 403) {
      return 'Seu acesso não permite enviar este checklist. Atualize a sessão ou solicite permissão ao responsável.';
    }
    if (status === 409) {
      return apiMessage || 'Este checklist já foi registrado ou entrou em conflito com outro envio. Atualize a página e tente novamente.';
    }
    if (status && status >= 500) {
      return apiMessage
        ? `A API não conseguiu concluir o envio: ${apiMessage}`
        : 'A API apresentou uma falha temporária. Aguarde alguns instantes e tente novamente.';
    }
    if (!status) {
      return 'Não foi possível conectar à API. Verifique sua conexão e tente novamente.';
    }
    return apiMessage || `Não foi possível enviar o checklist (erro ${status}). Tente novamente.`;
  }

  private extractApiErrorMessage(error: any): string | undefined {
    const data = error?.response?.data ?? error?.error ?? error?.data;
    const candidate = typeof data === 'string'
      ? data
      : data?.message ?? data?.msg ?? data?.error ?? data?.details;

    if (Array.isArray(candidate)) {
      return candidate.map(value => String(value)).filter(Boolean).join('; ') || undefined;
    }
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    return undefined;
  }

  public popUpResponse(msg: { msg: string, stt: 'confirm' | 'error' }, canClose=true) {
    const dialogref = this.dialog.open(
      PopUpResponseComponent, {
      data: msg,
      closable: !canClose
    }
    )
  }

  public openDialog(linkedOrderNum?: string): Observable<ChecklistSubmission> {
    const dialogRef = this.dialog.open(
      PopUpSubmitChecklistComponent, {
        closable: false,
        data: { linkedOrderNum }
      }
    )
    return dialogRef.onClose
  }

  private clearChecklistCache(partcode: string, tag: string) {
    const cacheKey = this.buildChecklistCacheKey(partcode, tag);
    if (!cacheKey) return;
    this.cacheservice.remove(cacheKey);
  }

  private buildChecklistCacheKey(partcode?: string, tag?: string): string | undefined {
    const normalizedPartcode = partcode?.trim().toUpperCase();
    const normalizedTag = tag?.trim().toLowerCase();

    if (!normalizedPartcode || !normalizedTag) {
      return undefined;
    }

    return `checklist:${normalizedPartcode}:${normalizedTag}`;
  }

}
