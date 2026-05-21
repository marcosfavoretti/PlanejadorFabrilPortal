import { DialogService } from 'primeng/dynamicdialog';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ItemPainelComponent } from '@/app/features/estrutura/widgets/item-painel/item-painel.component';
import { FilterItens } from '@/@core/abstract/filter-item.abstract';
import type { ResEstruturaItemTreeDTO } from '@/api/estrutura';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';
import { EstruturaContextService } from '@/app/features/estrutura/services/EstruturaContext.service';
import { CheckBoxResponseEvent } from '@/app/features/estrutura/widgets/item-result-list-register-checklist/item-result-list-register-checklist.component';
import { firstValueFrom } from 'rxjs';
import { PopUpResponseComponent } from '@/app/features/estrutura/widgets/pop-up-response/pop-up-response.component';

@Component({
  selector: 'app-check-list-admin-page',
  templateUrl: './check-list-admin-page.component.html',
  styleUrls: ['./check-list-admin-page.component.css'],
  standalone: true,
  imports: [
    ItemPainelComponent
  ]
})
export class CheckListAdminPageComponent implements OnInit {
  @ViewChild('painel') painel!: ItemPainelComponent;
  constructor(
    private itemrelationservice: EstruturaApiService,
    private modalservice: DialogService,
    private contextService: EstruturaContextService
  ) { }
  filter: FilterItens[] = []

  ngOnInit(): void {
  }

  async handleRequests({ itempai, event }: { itempai: string, event: CheckBoxResponseEvent[] }) {
    const isAutoSave = event.some(e => e.isAutoSave);
    const targetColumns = ['paRecorded', 'checkListAvaiable'];
    const toDO: {
      toAssign: Array<{ item: ResEstruturaItemTreeDTO, stt: 'feito' | 'pendente' }>,
      toUnAssign: Array<{ item: ResEstruturaItemTreeDTO, stt: 'feito' | 'pendente' }>,
      toCheckList: Array<{ item: ResEstruturaItemTreeDTO, stt: 'feito' | 'pendente' }>,
      toRCheckList: Array<{ item: ResEstruturaItemTreeDTO, stt: 'feito' | 'pendente' }>
    } = {
      toAssign: [],
      toUnAssign: [],
      toCheckList: [],
      toRCheckList: []
    };
    event.forEach(item => {
      if (item.column_changed === targetColumns[0]) {
        // pa
        if ((item.item as any).paRecorded) {
          toDO.toAssign.push({ item: item.item, stt: 'pendente' });
        } else {
          toDO.toUnAssign.push({ item: item.item, stt: 'pendente' });
        }
      } else if (item.column_changed === targetColumns[1]) {
        // checklist
        if ((item.item as any).checkListAvaiable) {
          toDO.toCheckList.push({ item: item.item, stt: 'pendente' });
        } else {
          toDO.toRCheckList.push({ item: item.item, stt: 'pendente' });
        }
      }
    });
    try {
      if (toDO.toAssign.some(m => m.stt === 'pendente')) {
        await firstValueFrom(this.itemrelationservice.assignItem(itempai, {
          itens: toDO.toAssign
            .filter(m => m.stt === 'pendente')
            .map(m => ({ partcode: (m.item as any).partcode, pa: (m.item as any).pa }))
        }));
        toDO.toAssign.forEach(m => { m.stt = 'feito'; });
      }

      if (toDO.toUnAssign.some(m => m.stt === 'pendente')) {
        await firstValueFrom(this.itemrelationservice.unAssignItem(itempai, {
          partcodes: toDO.toUnAssign
            .filter(m => m.stt === 'pendente')
            .map(m => (m.item as any).partcode)
        }));
        toDO.toUnAssign.forEach(m => { m.stt = 'feito'; });
      }

      const tag = this.contextService.getTag();
      if (!tag && (toDO.toCheckList.length > 0 || toDO.toRCheckList.length > 0)) {
        this.openResponseDialog({
          msg: 'Selecione ou crie uma tag antes de editar o checklist.',
          stt: 'error'
        });
        this.painel.requestItem();
        return;
      }

      if (toDO.toCheckList.some(m => m.stt === 'pendente')) {
        await firstValueFrom(this.itemrelationservice.createCheckList(itempai, tag!, {
          partcodes: toDO.toCheckList
            .filter(m => m.stt === 'pendente')
            .map(m => (m.item as any).partcode)
        }));
        toDO.toCheckList.forEach(m => { m.stt = 'feito'; });
      }

      if (toDO.toRCheckList.some(m => m.stt === 'pendente')) {
        await firstValueFrom(this.itemrelationservice.removeCheckList(itempai, tag!, {
          partcodes: toDO.toRCheckList
            .filter(m => m.stt === 'pendente')
            .map(m => (m.item as any).partcode)
        }));
        toDO.toRCheckList.forEach(m => { m.stt = 'feito'; });
      }

      if (!isAutoSave) {
        this.openResponseDialog({
          msg: `Checklist salvo na tag "${tag}".`,
          stt: 'confirm'
        });
      }

    } catch (error) {
      console.error('Erro ao processar as requisições:', error);
      this.openResponseDialog({
        msg: 'nao foi possivel salvar as mudanças. Favor entrar em contato com o TI',
        stt: 'error'
      });
    }
  }
  public openResponseDialog(msg: { msg: string, stt: 'confirm' | 'error' }) {
    this.modalservice.open(
      PopUpResponseComponent, {
      data: msg
    })
  }
}
