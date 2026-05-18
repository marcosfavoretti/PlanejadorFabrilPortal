import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ItemPainelComponent } from '@/app/features/estrutura/widgets/item-painel/item-painel.component';
import { FilterItens } from '@/@core/abstract/filter-item.abstract';
import { FilterCheckListActive } from '@/@core/filters/filter-by-checklist-ativo';
import { CheckBoxResponseEvent } from '@/app/features/estrutura/widgets/item-result-list-register-checklist/item-result-list-register-checklist.component';
import { PopUpSubmitChecklistComponent } from '@/app/features/estrutura/widgets/pop-up-submit-checklist/pop-up-submit-checklist.component';
import { Observable } from 'rxjs';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';
import { PopUpResponseComponent } from '@/app/features/estrutura/widgets/pop-up-response/pop-up-response.component';
import { CacheService } from '@/@core/services/cache-service.service';

@Component({
  selector: 'app-check-list-page',
  templateUrl: './check-list-page.component.html',
  styleUrls: ['./check-list-page.component.css'],
  standalone: true,
  imports: [ItemPainelComponent]
})
export class CheckListPageComponent implements OnInit {
  @ViewChild('painel') painel!: ItemPainelComponent;
  filters: FilterItens[] = [
    new FilterCheckListActive()
  ]
  constructor(
    private dialog: DialogService, 
    private apiservice: EstruturaApiService, 
    private cacheservice: CacheService
  ) { }

  async handleRequests({ itempai, event }: { itempai: string, event: CheckBoxResponseEvent[] }) {
    console.log(event);
    const dialoInput$ = this.openDialog();
    dialoInput$.subscribe(
      data => {
        this.submitLog(data.name, itempai)
      }
    );
  }

  ngOnInit() {
  }

  public submitLog(separador: string, itemfinal: string) {
    this.apiservice.newChecklistLog({
      SEPARADOR: separador,
      COD_ITEM_FINAL: itemfinal
    })
      .subscribe({
        error: (e) => this.popUpResponse({ msg: `nao foi possivel enviar os dados contate o TI\n error:${e}`, stt: 'error' }),
        next: async () => {
          this.popUpResponse({ msg: 'cadastrado com sucesso!! A pagina será recarregada em breve...', stt: 'confirm' }, false)
          this.cacheservice.remove(itemfinal);
          await new Promise(resolve => setInterval(resolve, 1500));
          window.location.reload();
        },
      })
  }

  public popUpResponse(msg: { msg: string, stt: 'confirm' | 'error' }, canClose=true) {
    const dialogref = this.dialog.open(
      PopUpResponseComponent, {
      data: msg,
      closable: !canClose
    }
    )
  }

  public openDialog(): Observable<{ name: string }> {
    const dialogRef = this.dialog.open(
      PopUpSubmitChecklistComponent, {
      closable: false
    }
    )
    return dialogRef.onClose
  }

}
