import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemPainelFilterPopupComponent } from '../item-painel-filter-popup/item-painel-filter-popup.component';
import { FilterItens } from '@/@core/abstract/filter-item.abstract';
import { FilterTypes } from '@/@core/enums/filtersTypes';
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
export class ItemPainelFilterComponent implements OnInit {
  constructor(private dialog: DialogService) { }
  @Input() partcode?: string
  @Input() cardMode: boolean = true
  filterStore !: { imagem: boolean; is110or220: boolean; nComprado: boolean } 
  @Input() disableFilters : boolean = true
  @Output('OnClearSearch') onClearSearch : EventEmitter<void> = new EventEmitter<void>()
  @Output('OnpartCodeFill') onPartCodeFill : EventEmitter<string> = new EventEmitter<string>()
  @Output('OnFilterSelected') onFilterSelected: EventEmitter<FilterItens[]> = new EventEmitter<FilterItens[]>()
  ngOnInit(): void {
      this.resetFilters()
  }
  requestSearch(){
    const partcode = this.partcode?.trim().toUpperCase();

    if(!partcode || partcode.length < 5) return

    this.partcode = partcode;
    this.onPartCodeFill.emit(partcode)
    this.resetFilters()
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
}
