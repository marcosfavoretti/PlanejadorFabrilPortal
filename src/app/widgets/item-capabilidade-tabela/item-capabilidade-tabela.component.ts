import { ConsultarTabelaCapabilidadeDTO } from '@/api/planejador';
import { ItemService } from '@/app/services/Item.service';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { TableModel } from '@/app/table-dynamic/@core/table.model';
import { TableDynamicComponent } from '@/app/table-dynamic/table-dynamic.component';
import { AsyncPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, Observable, of, tap } from 'rxjs';
import { ToastModule } from 'primeng/toast'
import { MESSAGEPROPS } from '@/@core/const/MESSAGEPROPS';
@Component({
  selector: 'app-item-capabilidade-tabela',
  imports: [
    ToastModule,
    TableDynamicComponent,
    AsyncPipe
  ],
  templateUrl: './item-capabilidade-tabela.component.html',
  styleUrl: './item-capabilidade-tabela.component.css'
})
export class ItemCapabilidadeTabelaComponent
  implements OnInit {

  constructor(
    private itemService: ItemService,
    private popupService: LoadingPopupService,
    private messageService: MessageService
  ) { }

  capabilidade$ !: Observable<ConsultarTabelaCapabilidadeDTO[]>;

  loadTable(): void {
    this.capabilidade$ = this.itemService.consultaCapabilidade();
    this.popupService.showWhile(this.capabilidade$);
  }

  ngOnInit(): void {
    this.loadTable();
  }

  public tableSchema: TableModel = {
    title: 'Item Capabilidades',
    columns: [
      {
        alias: 'item',
        field: 'item.Item'
      },
      {
        alias: 'item',
        field: 'item.tipo_item'
      },
      {
        alias: 'CAP. SOLDA',
        field: 'capabilidade.00015',
        isInputText: true,
      },
      {
        alias: 'CAP. LIXA',
        field: 'capabilidade.00017',
        isInputText: true,
      },
      {
        alias: 'CAP. BANHO',
        field: 'capabilidade.00035',
        isInputText: true,
      },
      {
        alias: 'CAP. PINTURA',
        field: 'capabilidade.00050',
        isInputText: true,
      },
      {
        alias: 'CAP. PINTURA PÓ',
        field: 'capabilidade.00020',
        isInputText: true,
      },
      {
        alias: 'CAP. MONTAGEM',
        field: 'capabilidade.00025',
        isInputText: true,
      },
      {
        alias: 'LEAD. SOLDA',
        field: 'leadtime.00015',
        isInputText: true,
      },
      {
        alias: 'LEAD. LIXA',
        field: 'leadtime.00017',
        isInputText: true,
      },
      {
        alias: 'LEAD. BANHO',
        field: 'leadtime.00035',
        isInputText: true,
      },
      {
        alias: 'LEAD. PINTURA',
        field: 'leadtime.00050',
        isInputText: true,
      },
      {
        alias: 'CAP. PINTURA PÓ',
        field: 'leadtime.00020',
        isInputText: true,
      },
      {
        alias: 'LEAD. MONTAGEM',
        field: 'leadtime.00025',
        isInputText: true,
      },

    ],
    totalize: false,
    paginator: true
  }

  updateItem(event: any): void {
    const atualizacao$ = this.itemService.atualizaCapabilidade(event.row);
    atualizacao$.pipe(
      tap(
        response => this.messageService.add(MESSAGEPROPS.SUCCESS('ITEM ATUALIZADO'))
      ),
      catchError(
        (err) => { this.messageService.add(MESSAGEPROPS.ERROR(err.message)); return of() }
      )
    ).subscribe();
  }
}
