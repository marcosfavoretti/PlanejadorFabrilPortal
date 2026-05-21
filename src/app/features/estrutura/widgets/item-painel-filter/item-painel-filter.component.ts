import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemPainelFilterPopupComponent } from '../item-painel-filter-popup/item-painel-filter-popup.component';
import { FilterItens } from '@/@core/abstract/filter-item.abstract';
import { FilterTypes } from '@/@core/enums/filtersTypes';

type ChecklistTagMode = 'select' | 'hybrid';
export interface ChecklistLookupPayload {
  partcode?: string;
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
    ]
})
export class ItemPainelFilterComponent implements OnInit, OnChanges {
  constructor(private dialog: DialogService) { }
  @Input() partcode?: string
  @Input() quickSearchCode: string = ''
  @Input() checklistTag?: string
  @Input() availableTags: { label: string, value: string }[] = []
  @Input() cardMode: boolean = true
  @Input() showChecklistTagField: boolean = false
  @Input() checklistTagMode: ChecklistTagMode = 'select'
  @Input() showChecklistActions: boolean = false
  @Input() disableChecklistActions: boolean = true
  filterStore !: { imagem: boolean; is110or220: boolean; nComprado: boolean } 
  @Input() disableFilters : boolean = true
  @Output('OnClearSearch') onClearSearch : EventEmitter<void> = new EventEmitter<void>()
  @Output('OnpartCodeFill') onPartCodeFill : EventEmitter<string> = new EventEmitter<string>()
  @Output('OnChecklistTagApply') onChecklistTagApply: EventEmitter<string> = new EventEmitter<string>()
  @Output('OnChecklistTagClear') onChecklistTagClear: EventEmitter<void> = new EventEmitter<void>()
  @Output('OnChecklistLookupSubmit') onChecklistLookupSubmit: EventEmitter<ChecklistLookupPayload> = new EventEmitter<ChecklistLookupPayload>()
  @Output('OnChecklistReset') onChecklistReset: EventEmitter<Event> = new EventEmitter<Event>()
  @Output('OnChecklistSubmit') onChecklistSubmit: EventEmitter<void> = new EventEmitter<void>()
  @Output('OnQuickSearchCodeChange') onQuickSearchCodeChange: EventEmitter<string> = new EventEmitter<string>()
  @Output('OnFilterSelected') onFilterSelected: EventEmitter<FilterItens[]> = new EventEmitter<FilterItens[]>()
  selectedExistingTag: string = ''
  newChecklistTag: string = ''

  ngOnInit(): void {
      this.resetFilters()
      this.syncTagFields()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['checklistTag'] || changes['availableTags'] || changes['checklistTagMode']) {
      this.syncTagFields();
    }
  }

  requestSearch(){
    const partcode = this.partcode?.trim().toUpperCase();

    if(!partcode || partcode.length < 5) return

    this.partcode = partcode;
    this.onPartCodeFill.emit(partcode)
    this.resetFilters()
  }

  submitChecklistLookup() {
    const partcode = this.partcode?.trim().toUpperCase();

    if (!partcode || partcode.length < 5) return;

    this.partcode = partcode;
    this.onChecklistLookupSubmit.emit({
      partcode,
      tag: this.resolveChecklistTag()
    });
    this.resetFilters();
  }

  applyChecklistTag() {
    const tagToApply = this.resolveChecklistTag();
    this.onChecklistTagApply.emit(tagToApply);
  }

  clearChecklistTag() {
    this.checklistTag = '';
    this.selectedExistingTag = '';
    this.newChecklistTag = '';
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

  resetFilters(){
    this.filterStore = {
      imagem : false,
      is110or220 : false,
      nComprado: false
    }
  }
  clearSearch(){
    this.partcode = undefined
    this.resetFilters()
    this.onClearSearch.emit()
  }

  openDialog(){
    const dialogRef = this.dialog.open(
      ItemPainelFilterPopupComponent, {
         width: '50vw',
         height: '50vh',
         data: this.filterStore,
         closable: false,
      }
    )
    dialogRef.onClose.subscribe(result  => {
      this.filterStore = result.filterStore
      this.onFilterSelected.emit(result.filterStategy)
    });
  }

  private syncTagFields() {
    const currentTag = this.checklistTag?.trim() || '';
    const existsInAvailable = this.availableTags.some(tag => tag.value === currentTag);

    if (this.checklistTagMode === 'select') {
      this.selectedExistingTag = existsInAvailable ? currentTag : '';
      this.newChecklistTag = '';
      return;
    }

    this.selectedExistingTag = existsInAvailable ? currentTag : '';
    this.newChecklistTag = existsInAvailable ? '' : currentTag;
  }

  private resolveChecklistTag(): string {
    const selectedTag = this.selectedExistingTag?.trim() || '';
    const newTag = this.newChecklistTag?.trim() || '';
    return this.checklistTagMode === 'hybrid' ? (newTag || selectedTag) : selectedTag;
  }
}
