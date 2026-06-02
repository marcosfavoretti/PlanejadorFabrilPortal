import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ViewChild, signal } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule, DatePipe } from '@angular/common';
import { ImageModule } from 'primeng/image';
import { FormsModule } from '@angular/forms';
import { tableColumns, TableModel } from './table.model';
import { exportRowsToXlsx } from '../../utils/spreadsheet-export';
import { InputNumberModule } from 'primeng/inputnumber'
import { Subject } from 'rxjs';
import { DatePicker } from 'primeng/datepicker'
import { TagModule } from 'primeng/tag'

@Component({
  standalone: true,
  selector: 'app-table-dynamic',
  templateUrl: './table-dynamic.component.html',
  styleUrls: ['./table-dynamic.component.css'],
  imports: [
    TableModule,
    DatePipe,
    InputNumberModule,
    ButtonModule,
    CommonModule,
    FormsModule,
    ImageModule,
    DatePicker,
    TagModule
  ]
})
export class TableDynamicComponent implements OnChanges, OnInit {
  @Input() data: any[] = [];
  @Input() tableModel!: TableModel
  expandedRowKeys: Record<string, boolean> = {};

  get tableSortField(): string | undefined {
    return this.tableModel?.sortField;
  }

  get tableSortOrder(): number {
    return this.tableModel?.sortOrder ?? 0;
  }

  get tableDataKey(): string {
    return this.tableModel?.dataKey || 'atr_group';
  }

  @Output('OnChecked') onChecked: EventEmitter<{ row: any, column: any, checked: any, oldValue: any }> = new EventEmitter();
  @Output() onRowExpanded = new EventEmitter<any>();
  @Output() onRowCollapsed = new EventEmitter<any>();
  @Input() rowExpansionTemplate?: TemplateRef<any>;
  @Input() Externalfilter?: { value: string, filed: string, method: 'contains' }
  @Input() exportable: boolean = true;
  @Input() scrollable: boolean = false;
  @Input() scrollHeight: string = 'auto';
  @Input() responsiveLayout: 'scroll' | 'stack' = 'scroll';
  @Input() breakpoint: string = '960px';
  
  failedImages = signal(new Set<string>());
  
  private inputChanged$ = new Subject<{ row: any; column: any; value: any }>();
  private activeFilters = new Set<string>();

  @ViewChild('dt2') dt2!: Table
  Array = Array;
  Object = Object;

  onDateSelect(event: Date, filter: Function) {
    const utcDate = event;
    console.log(event)
    filter(utcDate);
  }
  
  onImageError(url: string) {
    this.failedImages.update(set => {
      const newSet = new Set(set);
      newSet.add(url);
      return newSet;
    });
  }

  ngOnInit() {
    this.data = this.processDateColumns(this.data);
    this.syncExpandedRowKeys();
    this.updateFilterStatus();

    this.inputChanged$
      .subscribe(({ row, column, value }) => {
        this.onNewCheckEvent(row, column, value);
      });
  }

  private processDateColumns(data: any[]): any[] {
    if (!this.tableModel || !this.tableModel.columns || !data) {
      return data;
    }

    return data.map(row => {
      const newRow = { ...row };
      this.tableModel.columns.forEach(col => {
        if (col.isDate) {
          const val = this.getNestedValue(newRow, col.field);
          if (val && !(val instanceof Date)) {
            const date = new Date(val);
            if (!isNaN(date.getTime())) {
              this.setNestedValue(newRow, col.field, date);
            } else {
              console.warn(`Invalid date value for field ${col.field}: ${val}`);
            }
          }
        }
      });
      return newRow;
    });
  }

  onInputChangeDebounced(row: any, column: any, value: any) {
    console.log(row, column, value)
    this.inputChanged$.next({ row, column, value });
  }

  onNewCheckEvent(row: any, column: string, value: any): void {
    const oldValue = this.getNestedValue(row, column);
    this.setNestedValue(row, column, value)
    
    if (value === null || value === undefined) return;
    
    this.onChecked.emit({
      row: row,
      column: column,
      checked: value,
      oldValue: oldValue
    });
  }

  public applyFilterGlobal($event: any, stringVal: any) {
    this.dt2!.filterGlobal(($event.target as HTMLInputElement).value.trim(), stringVal.trim());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      const processedData = this.processDateColumns(changes['data'].currentValue);
      this.data = this.tableModel.totalize 
        ? processedData.map(item => ({ ...item, atr_group: 'GROUP' }))
        : processedData;
      this.syncExpandedRowKeys();
      this.updateFilterStatus();
    }
    
    if (this.Object.hasOwn(changes, 'filter') && changes['filter'].currentValue) {
      this.filterTable(changes['filter'].currentValue as { value: string, field: string, method: 'contains' | 'notEquals' });
    }
  }

  getTotalOfColumn(column: tableColumns): number | undefined {
    if (!column.toTotalize) return;
    return this.data.reduce((total, item) => {
      const value = Number(this.getNestedValue(item, column.field));
      if (!isNaN(value)) {
        return total + value;
      }
      return total;
    }, 0);
  }

  getAllColumns(): string[] {
    const ocultColumns = this.tableModel?.ghostControll?.map(col => col.field);
    const visibleColumns = this.tableModel.columns?.map(col => col.field);
    if (ocultColumns && ocultColumns?.length > 1) {
      visibleColumns!.push(...ocultColumns)
    }
    return visibleColumns!;
  }

  getNestedValue(object: any, key: any): any {
    const result = key.split('.').reduce((acc: any, curr: any) => {
      if (Array.isArray(acc)) {
        return acc.map(item => {
          if (Array.isArray(item)) {
            return item[0][curr]
          }
          else {
            return item[curr];
          }
        });
      }
      return acc ? acc[curr] : null;
    }, object);
    return result;
  }

  setNestedValue(obj: any, key: string, value: any): void {
    const keys = key.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];

      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }

      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }

  checkHighLight(data: any): { [key: string]: string } | undefined {
    if (!this.tableModel.ghostControll) return undefined;
    for (const controll of this.tableModel.ghostControll) {
      const value = this.getNestedValue(data, controll.field);
      
      if (controll.ifValueEqual !== undefined && String(controll.ifValueEqual) === String(value)) {
        return { 'background-color': controll.color };
      }
      
      if (controll.ifValueGreater && controll.ifValueGreater(data)) {
        return { 'background-color': controll.color };
      }
      if (controll.ifRowFunction && controll.ifRowFunction(data)) {
        return { 'background-color': controll.color };
      }
    }
    return undefined;
  }

  getTotalizeColumns() {
    return this.tableModel.columns?.filter(column => column.toTotalize);
  }

  private syncExpandedRowKeys(): void {
    if (this.tableModel?.totalize) {
      this.expandedRowKeys = { GROUP: true };
      return;
    }

    if (!this.tableModel?.expandable) {
      this.expandedRowKeys = {};
    }
  }

  filterTable(payload: { value: string, field: string, method: 'contains' | 'notEquals' }): void {
    const { value, field, method } = payload;
    this.dt2.filter(value, field, method);
    if (value !== null && value !== undefined && value !== '') {
        this.activeFilters.add(field);
    } else {
        this.activeFilters.delete(field);
    }
    this.updateFilterStatus();
  }

  clearFilter(): void {
    this.dt2.clear()
    this.dt2.reset()
    this.activeFilters.clear();
    this.updateFilterStatus();
  }

  onTableFilter(event: any): void {
    this.activeFilters.clear();
    for (const field in event.filters) {
      const filterMeta = event.filters[field];
      if (Array.isArray(filterMeta)) {
        if (filterMeta.some(fm => fm.value !== null && fm.value !== undefined && fm.value !== '')) {
          this.activeFilters.add(field);
        }
      } else {
        if (filterMeta.value !== null && filterMeta.value !== undefined && filterMeta.value !== '') {
          this.activeFilters.add(field);
        }
      }
    }
    this.updateFilterStatus();
  }

  private updateFilterStatus(): void {
    if (this.tableModel && this.tableModel.columns) {
      this.tableModel.columns.forEach(col => {
        col.filterActive = this.activeFilters.has(col.field);
      });
    }
  }

  async exportarExcel() {
    const dados = this.data.map(row => {
      const resultado: { [k: string]: string } = {};
      this.tableModel.columns.forEach(col => {
        resultado[col.field] = this.getNestedValue(row, col.field);
      });
      return resultado;
    });

    await exportRowsToXlsx(dados, `${this.tableModel.title || 'export'}_${new Date().getTime()}.xlsx`);
  }

  handleRowExpand(event: any) {
    this.onRowExpanded.emit(event.data);
  }

  handleRowCollapse(event: any) {
    this.onRowCollapsed.emit(event.data);
  }

  protected normalizeCurrencyValue(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }
}
