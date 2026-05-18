import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ImageModule } from 'primeng/image';
import { CacheService } from '@/@core/services/cache-service.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from "primeng/confirmdialog"
import { ToastModule } from "primeng/toast"
import { Subject } from 'rxjs';
import type { ResEstruturaItemTreeDTO } from '@/api/estrutura';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { tableColumns, TableModel } from '@/app/shared/components/table-dynamic/table.model';

export interface CheckBoxResponseEvent {
  column_changed: string,
  item: ResEstruturaItemTreeDTO,
  isAutoSave?: boolean
}

@Component({
  selector: 'app-item-result-list-register-checklist',
  templateUrl: './item-result-list-register-checklist.component.html',
  styleUrls: ['./item-result-list-register-checklist.component.css'],
  standalone: true,
  providers: [ConfirmationService, MessageService],
  imports: [
    TableModule,
    FormsModule,
    ImageModule,
    ToastModule,
    ConfirmDialogModule,
    TableDynamicComponent
  ]
})
export class ItemResultListRegisterChecklistComponent implements OnChanges, OnInit {
  @Input('target_item') target_item?: string
  @Input('submitButton') submitButton: boolean = false
  @Input('itens') itens?: ResEstruturaItemTreeDTO[];
  itens_original_copy?: ResEstruturaItemTreeDTO[];
  @Input('target_columns') target_columns !: string[]
  @Input('paginator') paginator: boolean = true
  @Input('exportable') exportable: boolean = true
  // @Input('target_columns') target_columns !: Array<keyof ItemModelInColeta>
  @ViewChild('dt') dt!: TableDynamicComponent;
  @Output('onSubmitResponse') onsubmitresponse: Subject<CheckBoxResponseEvent[]> = new Subject<CheckBoxResponseEvent[]>();
  @Output('UnsavedChanges') onUnsavedChanges: EventEmitter<ResEstruturaItemTreeDTO[]> = new EventEmitter<ResEstruturaItemTreeDTO[]>();

  tableModel: TableModel = {
    title: '',
    totalize: false,
    columns: [],
    paginator: true
  };

  constructor(private cacheService: CacheService, private primengconfirmation: ConfirmationService) { }

  ngOnInit(): void {
    this.tableModel.paginator = this.paginator
  }

  public onTableChecked(event: any): void {
    const { row, column, checked } = event;
    if (!this.itens) return;

    // Sincroniza o item alterado na tabela com a nossa lista local
    const target = this.itens.find(item => (item as any).partcode === row.partcode);
    if (target) {
      (target as any)[column] = checked;
      this.checkUnsavedChanges();
      
      // Se não houver botão de submit, mas houver colunas alvo, salvamos automaticamente
      if (!this.submitButton && this.target_columns.length > 0) {
        this.formsSubmitted(true);
      }
    }
  }

  public checkUnsavedChanges(): void {
    const changes: ResEstruturaItemTreeDTO[] = []
    if (!this.itens || !this.itens_original_copy) return;
    
    const total_index = this.itens_original_copy.length;
    for (let i = 0; i < total_index; i++) {
      if (JSON.stringify(this.itens_original_copy[i]) !== JSON.stringify(this.itens[i])) {
        changes.push(this.itens[i])
      }
    }
    
    // Persiste as mudanças no cache local storage
    if (this.target_item) {
      this.cacheService.set(this.target_item, changes);
    }

    this.onUnsavedChanges.emit(changes);//emito a lista que esta com as alterções
  }

  public resetCheckList(event: Event): void {
    this.primengconfirmation.confirm({
      target: event?.target as EventTarget,
      message: 'Deseja mesmo iniciar um novo checkList? Todo progresso será perdido',
      accept: () => {
        if (!this.target_item) return
        this.cacheService.remove(this.target_item);
        this.itens = this.normalizeItens(this.itens_original_copy);
        this.onUnsavedChanges.emit([]);
      },
    })
  }

  public applyFilterGlobal($event: any, stringVal: any) {
    this.dt.filterTable({ value: ($event.target as HTMLInputElement).value, field: 'partcode', method: stringVal });
  }


  public loadCacheChanges(): ResEstruturaItemTreeDTO[] {
    if (!this.target_item) return []
    return this.cacheService.get<ResEstruturaItemTreeDTO[]>(this.target_item) || [];
  }


  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['paginator']) {
      this.tableModel.paginator = this.paginator
    }
    if (this.itens) {
      this.itens_original_copy = this.itens.map(item => JSON.parse(JSON.stringify(item)))
      const incacheChages = this.loadCacheChanges();
      this.itens = this.normalizeItens(
        this.itens.map(item => {
          const target_change = incacheChages.find(change => (change as any).partcode === (item as any).partcode);
          return target_change ? { ...target_change } : item;
        })
      );
      this.sortItens();
      this.buildTableSchema();
    }
  }

  private normalizeItens(itens?: ResEstruturaItemTreeDTO[]): ResEstruturaItemTreeDTO[] {
    if (!itens) return [];

    return itens.map(item => {
      const normalizedItem = JSON.parse(JSON.stringify(item));
      const quantidade = (normalizedItem as any).qtd ?? (normalizedItem as any).quantidade ?? '';
      const medida = (normalizedItem as any).medida ? String((normalizedItem as any).medida).toLowerCase() : '';
      (normalizedItem as any).qtd_display = `${quantidade}${medida ? ` ${medida}` : ''}`;
      return normalizedItem;
    });
  }

  private sortItens(): void {
    if (!this.itens) return;
    
    // Identifica qual coluna usar para ordenação baseado no que foi passado em target_columns
    // Se for checklist admin (cadastro), prioriza checkListAvaiable
    // Se for coleta, prioriza collected
    const sortPriority = ['collected', 'checkListAvaiable'];
    const sortField = sortPriority.find(field => this.target_columns.includes(field));

    if (sortField) {
      this.itens.sort((a, b) => {
        const valA = (a as any)[sortField] ? 1 : 0;
        const valB = (b as any)[sortField] ? 1 : 0;
        return valB - valA; // Checked (1) vem antes de Unchecked (0)
      });
    }
  }

  private buildTableSchema() {
    const columns: tableColumns[] = [];
    for (const target of this.target_columns) {
      columns.push({ alias: target, field: target, isImg: false, isCheckBox: true });
    }
    columns.push({ alias: 'Partcode', field: 'partcode', isImg: false });
    columns.push({ alias: 'Tipo', field: 'item_status', isImg: false });
    columns.push({ alias: 'Quantidade', field: 'qtd_display', isImg: false });
    columns.push({ alias: 'PA', field: 'pa', isImg: false });
    columns.push({ alias: 'Imagem', field: 'imagem', isImg: true });

    this.tableModel.columns = columns;
    this.tableModel.ghostControll = [
      ...this.target_columns.map(col => ({
        field: col,
        ifValueEqual: true,
        color: '#d1e7dd',
        desc: col === 'collected' ? 'Coletado' : col
      })),
      {
        field: 'ehControle',
        ifValueEqual: true,
        color: '#fff3cd', // Yellow/Warning background
        desc: 'Item de Controle'
      }
    ];
  }


  // @HostListener('window:beforeunload', ['$event'])
  // unloadNotification($event: any): void {
  //   // Previne a saída sem confirmação
  //   if(!this.unsavedChanges) return
  //   const confirmationMessage = 'Tem certeza que deseja sair? As mudanças serão perdidas se não forem salvas.';
  //   $event.returnValue = confirmationMessage; // Para navegadores modernos
  // }

  public formsSubmitted(isAutoSave: boolean = false) {
    console.log(this.itens_original_copy, this.itens)
    const total_index = this.itens_original_copy?.length
    const difference_arr: CheckBoxResponseEvent[] = []
    if (!total_index) return
    for (let i = 0; i < total_index; i++) {
      for (const column of this.target_columns) {
        if ((this.itens_original_copy![i] as any)[column] !== (this.itens![i] as any)[column]) {
          difference_arr.push({
            column_changed: column,
            item: { ...this.itens![i] },
            isAutoSave: isAutoSave
          })
        }
      }
    }
    console.log(difference_arr);
    this.onsubmitresponse.next(difference_arr);

    // Se for auto-save, atualizamos o estado original para que as próximas mudanças 
    // sejam calculadas a partir deste novo estado
    if (isAutoSave) {
      this.itens_original_copy = this.itens!.map(item => JSON.parse(JSON.stringify(item)));
    }
  }



}
