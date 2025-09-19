import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule, DatePipe } from '@angular/common';
import { ImageModule } from 'primeng/image';
import { FormsModule } from '@angular/forms';
import { tableColumns, TableModel } from './@core/table.model';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { InputNumberModule } from 'primeng/inputnumber'
import { debounceTime, Subject } from 'rxjs';
import { DatePicker } from 'primeng/datepicker'
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
    DatePicker
  ]
})
export class TableDynamicComponent implements OnChanges, OnInit {
  @Input() data: any[] = []; // O array de objetos a ser exibido na tabela
  @Input() tableModel!: TableModel
  @Output('OnChecked') onChecked: EventEmitter<{ row: any, column: any, checked: any, oldValue: any }> = new EventEmitter();
  @Input() Externalfilter?: { value: string, filed: string, method: 'contains' }
  @Input() exportable: boolean = true;
  private inputChanged$ = new Subject<{ row: any; column: any; value: any }>();
  // Função auxiliar

  @ViewChild('dt2') dt2!: Table
  Array = Array;
  Object = Object;

  onDateSelect(event: Date, filter: Function) {
    const utcDate = new Date(Date.UTC(event.getFullYear(), event.getMonth(), event.getDate(),
      event.getHours(), event.getMinutes(), event.getSeconds()));
    filter(utcDate);
  }
  // Converter todas as datas para Date
  ngOnInit() {
    this.data = this.data.map(row => {
      const newRow = { ...row };
      this.tableModel.columns.forEach(col => {
        if (col.isDate) {
          const val = this.getNestedValue(newRow, col.field);
          if (val && !(val instanceof Date)) {
            this.setNestedValue(newRow, col.field, new Date(val));
          }
        }
      });
      return newRow;
    });

    // Debounce já existente
    this.inputChanged$
      .subscribe(({ row, column, value }) => {
        this.onNewCheckEvent(row, column, value);
      });
  }
  onInputChangeDebounced(row: any, column: any, value: any) {
    console.log(row, column, value)
    this.inputChanged$.next({ row, column, value });
  }

  onNewCheckEvent(row: any, column: any, event: any): void {
    const oldValue = row[column];
    this.setNestedValue(row, column, event)
    const value = this.getNestedValue(row, column);
    console.log(value)
    if (!value === null || value === undefined) return;
    this.onChecked.emit({
      row: row,
      column: column,
      checked: row[column],
      oldValue: oldValue
    });
  }

  public applyFilterGlobal($event: any, stringVal: any) {
    this.dt2!.filterGlobal(($event.target as HTMLInputElement).value.trim(), stringVal.trim());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.tableModel.totalize === true) this.data.map(data => data.atr_group = 'GROUP');
    if (this.Object.hasOwn(changes, 'filter') && changes['filter'].currentValue) {
      this.filterTable(changes['filter'].currentValue as { value: string, field: string, method: 'contains' | 'notEquals' });
    }
  }

  getTotalOfColumn(column: tableColumns): number | undefined {
    // Verificar se os dados existem e são um array de objetos
    if (!column.toTotalize) return;
    return this.data.reduce((total, item) => {
      const [targetItens] = this.getNestedValue(item, column.field);
      const value = Number(targetItens);
      if (!isNaN(value)) {
        return total + value;
      }
      return Number(total).toFixed(2); // Ignorar se não for número
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

      // Se não existir ou não for objeto, cria um objeto vazio
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
      if (String(controll.ifValueEqual) === String(value)) {
        return { 'background-color': controll.color };
      }
    }
    return undefined;
  }
  getTotalizeColumns() {
    return this.tableModel.columns?.filter(column => column.toTotalize);
  }

  filterTable(payload: { value: string, field: string, method: 'contains' | 'notEquals' }): void {
    const { value, field, method } = payload;
    this.dt2.filter(value, field, method);
  }

  clearFilter(): void {
    this.dt2.clear()
    this.dt2.reset()
  }

  exportarExcel() {
    const dados = this.data.map(row => {
      const resultado: { [k: string]: string } = {};
      this.tableModel.columns.forEach(col => {
        resultado[col.field] = this.getNestedValue(row, col.field);
      });
      return resultado;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dados);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Dados': worksheet },
      SheetNames: ['Dados']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });
    FileSaver.saveAs(blob, `${this.tableModel.title || 'export'}_${new Date().getTime()}.xlsx`);
  }
}
