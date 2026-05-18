import { DialogService, DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FilterItens } from '@/@core/abstract/filter-item.abstract';
import { FormsModule } from '@angular/forms';
import { InputSwitchChangeEvent, InputSwitchModule } from 'primeng/inputswitch';
import { FilterFactory } from '@/@core/factories/filter.factory';
import { FilterTypes } from '@/@core/enums/filtersTypes';
@Component({
  selector: 'app-item-painel-filter-popup',
  templateUrl: './item-painel-filter-popup.component.html',
  styleUrls: ['./item-painel-filter-popup.component.css'],
  standalone: true,
  imports: [
    FormsModule,
    InputSwitchModule
  ]
})
export class ItemPainelFilterPopupComponent {
  constructor(
    public dialogRef: DynamicDialogRef<ItemPainelFilterPopupComponent>,
    public config: DynamicDialogConfig
  ) {
    this.filterStore = this.config.data;
  }
  public filterStore: { imagem: boolean; is110or220: boolean; nComprado: boolean };
  
  filterTypesEnum = FilterTypes
  filter: FilterItens [] = []
  addFilter(filter: FilterItens){
    this.filter.push(filter);
  }
  onSwitchMove(param: FilterTypes, event: InputSwitchChangeEvent) {
    const filterStrategy = FilterFactory.build(param);
    if (event.checked) {
      this.filter.push(filterStrategy);
    } else {
      const index = this.filter.findIndex(
        (f) => f.constructor === filterStrategy.constructor
      );
      if (index > -1) {
        this.filter.splice(index, 1);
      }
    }
  }
  
  onNoClick(): void {
    this.dialogRef.close({
      filterStategy: this.filter,
      filterStore : this.filterStore
    });
  }
}
