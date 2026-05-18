import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';
import { catchError, of, tap } from 'rxjs';
import { ItemHierarchyListaComponent } from '../item-hierarchy-lista/item-hierarchy-lista.component';
import { ItemPainelFilterComponent } from '../item-painel-filter/item-painel-filter.component';
import { FilterItens } from '@/@core/abstract/filter-item.abstract';
import { TreeNode } from 'primeng/api';
import { parseToTreeNode } from '../../utils/parse-to-treeNode';
import { parseToList } from '../../utils/parse-to-list';
import { TagModule } from 'primeng/tag'
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckBoxResponseEvent, ItemResultListRegisterChecklistComponent } from '../item-result-list-register-checklist/item-result-list-register-checklist.component';
import { PopUpResponseComponent } from '../pop-up-response/pop-up-response.component';
import { CacheService } from '@/@core/services/cache-service.service';
import type { ResEstruturaItemTreeDTO } from '@/api/estrutura';
import { PartcodeImageService } from '@/app/shared/services/partcode-image.service';
import { EstruturaContextService } from '@/app/features/estrutura/services/EstruturaContext.service';
import { OnInit, effect } from '@angular/core';
@Component({
  selector: 'app-item-painel',
  templateUrl: './item-painel.component.html',
  styleUrls: ['./item-painel.component.css'],
  standalone: true,
  imports: [
    TagModule,
    ProgressSpinnerModule,
    ItemHierarchyListaComponent,
    ItemPainelFilterComponent,
    ItemResultListRegisterChecklistComponent
  ]
})
export class ItemPainelComponent implements OnInit {
  constructor(
    private itemrelationservice: EstruturaApiService,
    private dialog: DialogService,
    private cacheservice: CacheService,
    private imageService: PartcodeImageService,
    private contextService: EstruturaContextService
  ) { 
    effect(() => {
      const pc = this.contextService.partcode();
      if (pc && pc !== this.givenPartcode) {
        this.givenPartcode = pc;
      }
    });
  }

  @Input('filters') filters: FilterItens[] = []
  @Input('modo') modo: 'default' | 'coleta' | 'cadastro' = 'default'
  @Input('paginator') paginator: boolean = true
  @Input('cardMode') cardMode: boolean = true
  @Input('exportable') exportable: boolean = true
  @Input('showFilterBar') showFilterBar: boolean = true
  
  private _givenPartcode?: string
  @Input() set givenPartcode(value: string | undefined) {
    const normalized = value?.trim().toUpperCase();
    if (normalized && normalized !== this._givenPartcode) {
      this._givenPartcode = normalized;
      this.requestItem();
    } else {
      this._givenPartcode = normalized;
    }
  }
  get givenPartcode(): string | undefined {
    return this._givenPartcode;
  }

  @Output('onSubmitResponse') onsubmitresponse: EventEmitter<{ itempai: string, event: CheckBoxResponseEvent[] }> = new EventEmitter<{ itempai: string, event: CheckBoxResponseEvent[] }>();
  requestingData: boolean = false
  errorMessage?: string
  targetItemDisplay?: ResEstruturaItemTreeDTO
  targetItemOriginal?: ResEstruturaItemTreeDTO
  targetItemDisplayTreeNode?: TreeNode[]
  targetItemDisplayList?: ResEstruturaItemTreeDTO[]
  hasFiltersApply: boolean = false

  ngOnInit(): void {
  }

  public clearCacheChanges(): void {
    this.cacheservice.remove((this.targetItemOriginal! as any).partcode);
  }

  public eventValidStategy(event: CheckBoxResponseEvent[]) {
    if (this.modo === 'cadastro') {
      this.onsubmitresponse.emit({
        itempai: (this.targetItemOriginal! as any).partcode,
        event: event
      })
    }
    if (this.modo === 'coleta') {
      if (event.length === this.targetItemDisplayList!.length) {
        this.onsubmitresponse.emit({
          itempai: (this.targetItemOriginal! as any).partcode,
          event: event
        })
      }
      else {
        this.dialog.open(PopUpResponseComponent, {
          data: { msg: 'selecione todos os itens para enviar o checklist', stt: 'error' }
        })
      }
    }
  }

  public requestItem() {
    if (!this.givenPartcode) return
    this.contextService.setPartcode(this.givenPartcode);
    this.requestingData = true
    this.hasFiltersApply = false
    this.targetItemOriginal = undefined
    this.targetItemDisplay = undefined
    this.targetItemDisplayList = undefined
    this.targetItemDisplayTreeNode = undefined
    this.itemrelationservice.getItemHierarchy(this.givenPartcode)
      .pipe(
        tap(
          (data) => {
            this.targetItemDisplay = data
            this.targetItemOriginal = data
            this.targetItemDisplayTreeNode = parseToTreeNode(data, (p) => this.imageService.pictureRenderLink({ partcode: p }))
            this.requestingData = false
            /*
             * caso tiver filtros passados como padrao eu irei pegalos 
             * e aplicalos, tirando a necessidade de mostrar uma lista de hierarquia
             */
            if (this.filters.length > 0) this.filterData(this.filters);
          }
        ),
        catchError((error) => {
          console.log(error)
          this.requestingData = false;
          this.errorMessage = error.data.response.message
          this.dialog.open(PopUpResponseComponent, {
            data: { msg: `Erro: Erro a consultar o dado\n${error.response.data.message}`, stt: 'error' }
          })
          return of(error.response.data.message);
        })
      )
      .subscribe()
  }

  public onClearSearch() {
    this.givenPartcode = undefined;
    this.targetItemDisplay = undefined;
    this.targetItemOriginal = undefined;
    if (this.modo === 'default') {
      this.filters = [];
    }
  }

  public filterData(filterArr: FilterItens[]) {
    this.filters = filterArr;
    this.targetItemDisplay = this.targetItemOriginal;
    
    if (!filterArr.length) {
      this.targetItemDisplayList = undefined
      this.hasFiltersApply = false
    }
    else {
      this.hasFiltersApply = true
      for (const filter of filterArr) {
        if (!this.targetItemDisplay) break
        const filtered = filter.filterProcess(this.targetItemDisplay)
        this.targetItemDisplay = filtered
      }

      if (this.targetItemDisplay) {
        const skipRoot = this.modo === 'coleta' || this.modo === 'cadastro';
        this.targetItemDisplayList = parseToList(
          this.targetItemDisplay,
          skipRoot,
          (partcode) => this.imageService.pictureRenderLink({ partcode })
        );
      } else {
        this.targetItemDisplayList = [];
      }
    }
  }

}
