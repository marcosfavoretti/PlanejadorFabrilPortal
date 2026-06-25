import { DialogService } from 'primeng/dynamicdialog';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';
import { catchError, of, tap } from 'rxjs';
import { ItemHierarchyListaComponent } from '../item-hierarchy-lista/item-hierarchy-lista.component';
import { ChecklistLookupPayload, ItemPainelFilterComponent } from '../item-painel-filter/item-painel-filter.component';
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
import { ActivatedRoute, Router } from '@angular/router';
import { ChecklistCadastroResultComponent } from '../checklist-cadastro-result/checklist-cadastro-result.component';
import { ChecklistColetaResultComponent } from '../checklist-coleta-result/checklist-coleta-result.component';
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
    ItemResultListRegisterChecklistComponent,
    ChecklistCadastroResultComponent,
    ChecklistColetaResultComponent
  ]
})
export class ItemPainelComponent implements OnInit {
  @ViewChild(ItemResultListRegisterChecklistComponent)
  checklistResultList?: ItemResultListRegisterChecklistComponent;

  constructor(
    private itemrelationservice: EstruturaApiService,
    private dialog: DialogService,
    private cacheservice: CacheService,
    private imageService: PartcodeImageService,
    private contextService: EstruturaContextService,
    private route: ActivatedRoute,
    private router: Router
  ) { 
    effect(() => {
      const tag = this.contextService.tag();
      if (tag !== this.selectedTag) {
        this.selectedTag = tag || '';
        this.selectedTagInput = tag || '';
        this.updateQueryParams();

        if (this._givenPartcode && (tag || this.canPreviewStructureWithoutTag)) {
          this.requestItem();
        }
      }

      const pc = this.contextService.partcode();
      if (pc && pc !== this.givenPartcode) {
        this.givenPartcode = pc;
      }
    });
  }

  availableTags: { label: string, value: string }[] = [];
  selectedTag: string = '';
  selectedTagInput: string = '';
  quickSearchCode: string = '';

  get shouldShowTagSelector(): boolean {
    return Boolean(this.givenPartcode) && (this.modo === 'coleta' || this.modo === 'cadastro');
  }

  get checklistTagMode(): 'select' | 'hybrid' {
    return this.modo === 'cadastro' ? 'hybrid' : 'select';
  }

  get canPreviewStructureWithoutTag(): boolean {
    return this.modo === 'cadastro';
  }

  get shouldShowChecklistActions(): boolean {
    return this.modo === 'coleta';
  }

  get disableChecklistActions(): boolean {
    return !this.targetItemDisplayList?.length || !this.hasFiltersApply;
  }

  get tagHelperText(): string {
    if (!this.givenPartcode) {
      return 'Busque um item pai para listar as tags e iniciar o checklist.';
    }

    if (!this.availableTags.length) {
      return this.modo === 'cadastro'
        ? 'Nenhuma tag encontrada para este item. Crie uma nova tag para iniciar o primeiro checklist.'
        : 'Nenhuma tag disponivel para este item.';
    }

    if (!this.selectedTag) {
      return this.modo === 'cadastro'
        ? 'Selecione uma tag existente ou digite uma nova para continuar.'
        : 'Selecione uma tag existente para continuar.';
    }

    if (!this.availableTags.some(tag => tag.value === this.selectedTag)) {
      return `A tag "${this.selectedTag}" ainda nao existe. Ao salvar, ela sera criada para este item.`;
    }

    return `Checklist ativo na tag "${this.selectedTag}".`;
  }

  applyTagSelection(tagValue?: string) {
    const normalizedTag = this.normalizeTag(tagValue ?? this.selectedTagInput);

    if (!normalizedTag) {
      this.clearSelectedTag();
      return;
    }

    this.contextService.setTag(normalizedTag);
    this.selectedTag = normalizedTag;
    this.selectedTagInput = normalizedTag;
    this.updateQueryParams();

    if (this.givenPartcode) {
      this.requestItem();
    }
  }

  clearSelectedTag() {
    this.contextService.clearTag();
    this.selectedTag = '';
    this.selectedTagInput = '';
    this.updateQueryParams();

    if (this.givenPartcode && this.canPreviewStructureWithoutTag) {
      this.requestItem();
      return;
    }

    this.targetItemDisplay = undefined;
    this.targetItemOriginal = undefined;
    this.targetItemDisplayTreeNode = undefined;
    this.targetItemDisplayList = undefined;
    this.errorMessage = 'Selecione uma tag para visualizar o checklist.';
  }

  submitChecklistLookup(payload: ChecklistLookupPayload) {
    const normalizedPartcode = payload.partcode?.trim().toUpperCase();

    if (!normalizedPartcode || normalizedPartcode.length < 5) {
      return;
    }

    const normalizedTag = this.normalizeTag(payload.tag);

    this._givenPartcode = normalizedPartcode;
    this.contextService.setPartcode(normalizedPartcode);

    this.selectedTag = normalizedTag;
    this.selectedTagInput = normalizedTag;

    if (normalizedTag) {
      this.contextService.setTag(normalizedTag);
    } else {
      this.contextService.clearTag();
    }

    this.updateQueryParams();
    this.requestItem();
  }

  @Input('filters') filters: FilterItens[] = []
  @Input('modo') modo: 'default' | 'coleta' | 'cadastro' = 'default'
  @Input('paginator') paginator: boolean = true
  @Input('cardMode') cardMode: boolean = true
  @Input('exportable') exportable: boolean = true
  @Input('showFilterBar') showFilterBar: boolean = true
  @Input() stickyChecklistHeader: boolean = false
  
  private _givenPartcode?: string
  @Input() set givenPartcode(value: string | undefined) {
    const normalized = value?.trim().toUpperCase();
    if (normalized && normalized !== this._givenPartcode) {
      this._givenPartcode = normalized;
      this.updateQueryParams();
      this.requestItem();
    } else {
      this._givenPartcode = normalized;
      if (!normalized) {
        this.updateQueryParams();
      }
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
    const partcode = this.route.snapshot.queryParamMap.get('partcode');
    const tag = this.route.snapshot.queryParamMap.get('tag');

    if (tag) {
       this.selectedTag = tag;
       this.selectedTagInput = tag;
       this.contextService.setTag(tag);
    }
    
    if (partcode) {
       this.givenPartcode = partcode;
       this.contextService.setPartcode(partcode);
    }
  }

  private updateQueryParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        partcode: this._givenPartcode || null,
        tag: this.selectedTag || null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  public clearCacheChanges(): void {
    const cacheKey = this.buildChecklistCacheKey(
      (this.targetItemOriginal! as any).partcode,
      this.selectedTag
    );

    if (!cacheKey) return;
    this.cacheservice.remove(cacheKey);
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

  public resetChecklistFromToolbar(event: Event): void {
    this.checklistResultList?.resetCheckList(event);
  }

  public submitChecklistFromToolbar(): void {
    this.checklistResultList?.formsSubmitted();
  }

  public onQuickSearchCodeChange(value: string): void {
    this.quickSearchCode = value;
    this.checklistResultList?.applyPartcodeFilter(value);
  }

  public requestItem() {
    if (!this.givenPartcode) return
    this.contextService.setPartcode(this.givenPartcode);
    this.requestingData = true
    this.errorMessage = undefined
    this.hasFiltersApply = false
    this.targetItemOriginal = undefined
    this.targetItemDisplay = undefined
    this.targetItemDisplayList = undefined
    this.targetItemDisplayTreeNode = undefined
    
    this.itemrelationservice.getChecklistTags(this.givenPartcode)
      .pipe(
        catchError(() => of({ tags: [] }))
      )
      .subscribe(res => {
        const tags: string[] = Array.isArray(res?.tags) ? res.tags : [];
        this.availableTags = this.normalizeTagOptions(tags);

        if (this.selectedTag && !this.availableTags.some(tag => tag.value === this.selectedTag)) {
          this.availableTags = [
            { label: this.selectedTag, value: this.selectedTag },
            ...this.availableTags
          ];
        }
      });

    if (!this.selectedTag && !this.canPreviewStructureWithoutTag) {
      this.requestingData = false;
      this.errorMessage = 'Selecione uma tag para visualizar o checklist.';
      return;
    }

    const itemRequest$ = this.modo === 'coleta'
      ? this.itemrelationservice.getChecklistHierarchy(this.givenPartcode, this.selectedTag)
      : this.itemrelationservice.getItemHierarchy(this.givenPartcode, this.selectedTag);

    itemRequest$
      .pipe(
        tap(
          (data) => {
            this.targetItemDisplay = data
            this.targetItemOriginal = data
            this.targetItemDisplayTreeNode = parseToTreeNode(data, (p) => this.imageService.pictureRenderLink({ partcode: p }))
            this.requestingData = false
            if (this.modo === 'coleta') {
              this.hasFiltersApply = true
              this.targetItemDisplayList = parseToList(
                data,
                true,
                (partcode) => this.imageService.pictureRenderLink({ partcode })
              );
              return;
            }

            if (this.filters.length > 0 || this.modo === 'cadastro') {
              this.filterData(this.filters);
            }
          }
        ),
        catchError((error) => {
          console.log(error)
          this.requestingData = false;
          this.errorMessage = this.extractErrorMessage(error)

          if (this.isTagMissingError(error)) {
            return of(undefined);
          }

          this.dialog.open(PopUpResponseComponent, {
            data: { msg: `Erro: ${this.errorMessage}`, stt: 'error' }
          })
          return of(undefined);
        })
      )
      .subscribe()
  }

  public onClearSearch() {
    this.givenPartcode = undefined;
    this.selectedTag = '';
    this.selectedTagInput = '';
    this.quickSearchCode = '';
    this.availableTags = [];
    this.contextService.clearTag();
    this.targetItemDisplay = undefined;
    this.targetItemOriginal = undefined;
    if (this.modo === 'default') {
      this.filters = [];
    }
    this.checklistResultList?.applyPartcodeFilter('');
    this.updateQueryParams();
  }

  public filterData(filterArr: FilterItens[]) {
    this.filters = filterArr;
    this.targetItemDisplay = this.targetItemOriginal;
    
    if (!filterArr.length) {
      if (this.modo === 'cadastro' && this.targetItemDisplay) {
        this.hasFiltersApply = true
        const hasChildren = (this.targetItemDisplay as any).filhos?.length > 0 || (this.targetItemDisplay as any).children?.length > 0;
        const skipRoot = hasChildren;
        this.targetItemDisplayList = parseToList(
          this.targetItemDisplay,
          skipRoot,
          (partcode) => this.imageService.pictureRenderLink({ partcode })
        );
      } else {
        this.targetItemDisplayList = undefined
        this.hasFiltersApply = false
      }
    }
    else {
      this.hasFiltersApply = true
      for (const filter of filterArr) {
        if (!this.targetItemDisplay) break
        const filtered = filter.filterProcess(this.targetItemDisplay)
        this.targetItemDisplay = filtered
      }

      if (this.targetItemDisplay) {
        const hasChildren = (this.targetItemDisplay as any).filhos?.length > 0 || (this.targetItemDisplay as any).children?.length > 0;
        const skipRoot = (this.modo === 'coleta' || this.modo === 'cadastro') && hasChildren;
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

  private normalizeTag(value?: string | null): string {
    return value?.trim().toLowerCase() || '';
  }

  private buildChecklistCacheKey(partcode?: string, tag?: string): string | undefined {
    const normalizedPartcode = partcode?.trim().toUpperCase();
    const normalizedTag = this.normalizeTag(tag);

    if (!normalizedPartcode || !normalizedTag) {
      return undefined;
    }

    return `checklist:${normalizedPartcode}:${normalizedTag}`;
  }

  private normalizeTagOptions(tags: string[]): { label: string, value: string }[] {
    const unique = new Map<string, string>();

    for (const rawTag of tags) {
      const normalized = this.normalizeTag(rawTag);
      if (normalized && !unique.has(normalized)) {
        unique.set(normalized, normalized);
      }
    }

    return Array.from(unique.values()).map(tag => ({ label: tag, value: tag }));
  }

  private extractErrorMessage(error: any): string {
    return error?.response?.data?.message
      || error?.data?.response?.message
      || error?.message
      || 'Nao foi possivel consultar os dados do checklist.';
  }

  private isTagMissingError(error: any): boolean {
    const message = this.extractErrorMessage(error).toLowerCase();
    return error?.response?.status === 400 && message.includes('tag');
  }
}
