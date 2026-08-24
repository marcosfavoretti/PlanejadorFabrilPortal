import {
  DialogService,
  DynamicDialogRef,
  DynamicDialogConfig,
} from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  inject,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, Subject } from 'rxjs';
import { BarcodeScannerInputComponent } from '@/app/shared/components/barcode-scanner-input/barcode-scanner-input.component';
import { PartcodeInputComponent } from '@/app/shared/components/partcode-input/partcode-input.component';
import { ItemPainelFilterPopupComponent } from '../item-painel-filter-popup/item-painel-filter-popup.component';
import { FilterItens } from '@/@core/abstract/filter-item.abstract';
import { FilterTypes } from '@/@core/enums/filtersTypes';

type ChecklistTagMode = 'select' | 'hybrid';
type ChecklistTagEntryMode = 'existing' | 'new';
export interface ChecklistLookupPayload {
  partcode?: string;
  orderNum?: string;
  tag?: string;
}

@Component({
  selector: 'app-item-painel-filter',
  templateUrl: './item-painel-filter.component.html',
  styleUrls: ['./item-painel-filter.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    BarcodeScannerInputComponent,
    PartcodeInputComponent,
  ],
})
export class ItemPainelFilterComponent implements OnInit, OnChanges {
  private static readonly ORDER_SEARCH_DEBOUNCE_MS = 500;
  private readonly destroyRef = inject(DestroyRef);
  private readonly orderNumberChanges$ = new Subject<string>();

  constructor(private dialog: DialogService) {}
  @Input() partcode?: string;
  @Input() orderNum = '';
  @Input() quickSearchCode: string = '';
  @Input() checklistTag?: string;
  @Input() availableTags: { label: string; value: string }[] = [];
  @Input() cardMode: boolean = true;
  @Input() showChecklistTagField: boolean = false;
  @Input() showOrderLookup: boolean = false;
  @Input() checklistTagMode: ChecklistTagMode = 'select';
  @Input() showChecklistActions: boolean = false;
  @Input() disableChecklistActions: boolean = true;
  filterStore!: { imagem: boolean; is110or220: boolean; nComprado: boolean };
  @Input() disableFilters: boolean = true;
  @Output('OnClearSearch') onClearSearch: EventEmitter<void> =
    new EventEmitter<void>();
  @Output('OnpartCodeFill') onPartCodeFill: EventEmitter<string> =
    new EventEmitter<string>();
  @Output('OnChecklistPartcodeSearch')
  onChecklistPartcodeSearch: EventEmitter<string> = new EventEmitter<string>();
  @Output('OnChecklistTagApply') onChecklistTagApply: EventEmitter<string> =
    new EventEmitter<string>();
  @Output('OnChecklistTagClear') onChecklistTagClear: EventEmitter<void> =
    new EventEmitter<void>();
  @Output('OnChecklistLookupSubmit')
  onChecklistLookupSubmit: EventEmitter<ChecklistLookupPayload> =
    new EventEmitter<ChecklistLookupPayload>();
  @Output('OnChecklistOrderScanned')
  onChecklistOrderScanned: EventEmitter<string> = new EventEmitter<string>();
  @Output('OnChecklistOrderSearch')
  onChecklistOrderSearch: EventEmitter<string> = new EventEmitter<string>();
  @Output('OnChecklistOrderChange')
  onChecklistOrderChange: EventEmitter<string> = new EventEmitter<string>();
  @Output('OnChecklistReset') onChecklistReset: EventEmitter<Event> =
    new EventEmitter<Event>();
  @Output('OnChecklistSubmit') onChecklistSubmit: EventEmitter<void> =
    new EventEmitter<void>();
  @Output('OnQuickSearchCodeChange')
  onQuickSearchCodeChange: EventEmitter<string> = new EventEmitter<string>();
  @Output('OnFilterSelected') onFilterSelected: EventEmitter<FilterItens[]> =
    new EventEmitter<FilterItens[]>();
  tagEntryMode: ChecklistTagEntryMode = 'existing';
  selectedExistingTag: string = '';
  newChecklistTag: string = '';
  private checklistPartcodeChanged = false;

  get isHybridTagMode(): boolean {
    return this.checklistTagMode === 'hybrid';
  }

  get hasAvailableTags(): boolean {
    return this.availableTags.length > 0;
  }

  get resolvedChecklistTag(): string {
    return this.resolveChecklistTag();
  }

  get canSubmitChecklistLookup(): boolean {
    const partcode = this.partcode?.trim();
    const orderNum = this.orderNum.trim();
    const hasOnlyPartcode = Boolean(
      partcode && !orderNum && partcode.length >= 5,
    );
    const hasOnlyOrder = Boolean(orderNum && !partcode);
    const hasResolvedOrder = Boolean(
      orderNum && partcode && partcode.length >= 5,
    );
    const needsOrderResolution = hasOnlyOrder;
    const needsPartcodeResolution = Boolean(
      hasOnlyPartcode && this.checklistPartcodeChanged,
    );
    return Boolean(
      needsOrderResolution ||
        needsPartcodeResolution ||
        ((hasOnlyPartcode || hasResolvedOrder) && this.resolvedChecklistTag),
    );
  }

  get tagModeLabel(): string {
    if (!this.isHybridTagMode) {
      return 'Selecionar tag';
    }

    return this.tagEntryMode === 'new'
      ? 'Criar nova tag'
      : 'Usar tag existente';
  }

  ngOnInit(): void {
    this.resetFilters();
    this.syncTagFields();
    this.orderNumberChanges$
      .pipe(
        debounceTime(ItemPainelFilterComponent.ORDER_SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((orderNum) => this.onChecklistOrderSearch.emit(orderNum));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['checklistTag'] ||
      changes['availableTags'] ||
      changes['checklistTagMode']
    ) {
      this.syncTagFields();
    }
  }

  requestSearch() {
    const partcode = this.partcode?.trim().toUpperCase();

    if (!partcode || partcode.length < 5) return;

    this.partcode = partcode;
    this.onPartCodeFill.emit(partcode);
    this.resetFilters();
  }

  submitChecklistLookup() {
    const partcode = this.partcode?.trim().toUpperCase();
    const orderNum = this.orderNum.trim();

    // No modo de checklist, Enter no partcode primeiro atualiza o contexto e
    // carrega as tags daquele item. Só depois disso a tag pode ser aplicada.
    if (partcode && this.checklistPartcodeChanged) {
      this.partcode = partcode;
      this.checklistPartcodeChanged = false;
      this.onChecklistPartcodeSearch.emit(partcode);
      this.resetFilters();
      return;
    }

    if (orderNum && !partcode) {
      this.cancelPendingOrderSearch();
      this.onChecklistOrderScanned.emit(orderNum);
      this.resetFilters();
      return;
    }

    if (!this.canSubmitChecklistLookup) return;

    this.partcode = partcode;
    this.orderNum = orderNum;
    this.onChecklistLookupSubmit.emit({
      partcode: partcode || undefined,
      orderNum: orderNum || undefined,
      tag: this.resolvedChecklistTag,
    });
    this.resetFilters();
  }

  onChecklistPartcodeInput(): void {
    if (this.partcode?.trim()) {
      this.orderNum = '';
    }
  }

  onPartcodeValueChange(value: string): void {
    this.checklistPartcodeChanged =
      this.normalizePartcode(value) !== this.normalizePartcode(this.partcode);
    this.partcode = value;
    this.onChecklistPartcodeInput();
  }

  onChecklistOrderInput(): void {
    if (this.orderNum.trim()) {
      this.partcode = '';
    }
  }

  onOrderNumberValueChange(value: string): void {
    this.orderNum = value;
    const normalizedOrderNum = value.trim();
    this.onChecklistOrderChange.emit(normalizedOrderNum);
    this.onChecklistOrderInput();
    this.orderNumberChanges$.next(normalizedOrderNum);
  }

  onOrderScanned(value: string): void {
    const orderNum = value.trim();
    if (!orderNum) return;
    this.cancelPendingOrderSearch();
    this.orderNum = orderNum;
    this.onChecklistOrderScanned.emit(orderNum);
  }

  applyChecklistTag() {
    const tagToApply = this.resolveChecklistTag();
    this.onChecklistTagApply.emit(tagToApply);
  }

  clearChecklistTag() {
    this.checklistTag = '';
    this.selectedExistingTag = '';
    this.newChecklistTag = '';
    this.tagEntryMode = this.hasAvailableTags ? 'existing' : 'new';
    this.onChecklistTagClear.emit();
  }

  resetChecklist(event: Event) {
    this.onChecklistReset.emit(event);
  }

  submitChecklist() {
    this.onChecklistSubmit.emit();
  }

  onQuickSearchInput() {
    this.onQuickSearchCodeChange.emit(this.quickSearchCode);
  }

  resetFilters() {
    this.filterStore = {
      imagem: false,
      is110or220: false,
      nComprado: false,
    };
  }
  clearSearch() {
    this.partcode = undefined;
    this.resetFilters();
    this.onClearSearch.emit();
  }

  openDialog() {
    const dialogRef = this.dialog.open(ItemPainelFilterPopupComponent, {
      width: '50vw',
      height: '50vh',
      data: this.filterStore,
      closable: false,
    });
    dialogRef.onClose.subscribe((result) => {
      this.filterStore = result.filterStore;
      this.onFilterSelected.emit(result.filterStategy);
    });
  }

  selectTagEntryMode(mode: ChecklistTagEntryMode) {
    this.tagEntryMode = mode;

    if (mode === 'existing') {
      this.newChecklistTag = '';
      return;
    }

    this.selectedExistingTag = '';
  }

  onExistingTagChange(value: string) {
    this.selectedExistingTag = value;
    if (value && this.isHybridTagMode) {
      this.tagEntryMode = 'existing';
      this.newChecklistTag = '';
    }
  }

  onNewTagInput() {
    if (!this.isHybridTagMode) {
      return;
    }

    if (this.newChecklistTag.trim()) {
      this.tagEntryMode = 'new';
      this.selectedExistingTag = '';
      return;
    }

    if (!this.selectedExistingTag) {
      this.tagEntryMode = this.hasAvailableTags ? 'existing' : 'new';
    }
  }

  private syncTagFields() {
    const currentTag = this.checklistTag?.trim() || '';
    const existsInAvailable = this.availableTags.some(
      (tag) => tag.value === currentTag,
    );

    if (this.checklistTagMode === 'select') {
      this.tagEntryMode = 'existing';
      this.selectedExistingTag = existsInAvailable ? currentTag : '';
      this.newChecklistTag = '';
      return;
    }

    this.tagEntryMode = existsInAvailable
      ? 'existing'
      : currentTag
        ? 'new'
        : this.hasAvailableTags
          ? 'existing'
          : 'new';
    this.selectedExistingTag = existsInAvailable ? currentTag : '';
    this.newChecklistTag = existsInAvailable ? '' : currentTag;
  }

  private resolveChecklistTag(): string {
    const selectedTag = this.selectedExistingTag?.trim() || '';
    const newTag = this.newChecklistTag?.trim() || '';
    if (this.checklistTagMode !== 'hybrid') {
      return selectedTag;
    }

    return this.tagEntryMode === 'new' ? newTag : selectedTag;
  }

  private normalizePartcode(value?: string): string {
    return value?.trim().toUpperCase() || '';
  }

  private cancelPendingOrderSearch(): void {
    this.orderNumberChanges$.next('');
  }
}
