import { Component, OnInit } from '@angular/core';
import { PlanejamentoAPIService } from '../../services/PlanejamentoAPI.service';
import { Observable, tap } from 'rxjs';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { CommonModule, DatePipe } from '@angular/common';
import { TabelaProducaoSimulacaoComponent } from '../tabela-producao-simulacao/tabela-producao-simulacao.component';
import { DatePickerModule } from 'primeng/datepicker';
import { BadgeModule } from 'primeng/badge';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contexto-simulacao',
  imports: [
    CommonModule,
    FormsModule,
    TabelaProducaoSimulacaoComponent,
    DatePickerModule,
    BadgeModule
  ],
  templateUrl: './contexto-simulacao.component.html',
  styleUrl: './contexto-simulacao.component.css'
})
export class ContextoSimulacaoComponent implements OnInit {
  date$!: Observable<string[]>;
  dates!: Date[];
  currentDatePointer: number = 0;
  currentDate!: Date;
  constructor(private api: PlanejamentoAPIService, private popup: LoadingPopupService) { }

  fixDate(datestr: string): Date {
    return new Date(datestr);
  }

  isDateInList(date: any): boolean {
    if(!this.dates) return false;
    return this.dates.some(
      d =>
        d.getDate() === date.day &&
        d.getMonth() === date.month &&
        d.getFullYear() === date.year
    );
  }

  nextDate(): void {
    if (this.currentDatePointer + 1 < this.dates.length) {
      this.currentDatePointer++;
      this.currentDate = this.dates[this.currentDatePointer];
    }
  }

  setDate(date: Date): void {
    const index = this.dates.findIndex(d => d.getTime() === date.getTime());
    if (index >= 0) {
      this.currentDatePointer = index;
    }
  }

  backDate(): void {
    if (this.currentDatePointer - 1 >= 0) {
      this.currentDatePointer--;
      this.currentDate = this.dates[this.currentDatePointer];
    }
    return;
  }


  ngOnInit(): void {
    this.date$ = this.api.requestDates()
      .pipe(
        tap(data => {
          this.dates = data.map(d => this.fixDate(d)).sort((a, b) => a.getTime() - b.getTime());
          this.currentDate = this.dates[0]
        })
      );
    this.popup.showWhile(this.date$);
  }
}
