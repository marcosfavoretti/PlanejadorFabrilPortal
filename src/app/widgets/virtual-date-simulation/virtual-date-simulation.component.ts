import { Component, OnInit } from '@angular/core';
import { VirtualDateStoreService } from '../../services/VirtualDateStore.service';
import { Observable } from 'rxjs';
import { AsyncPipe, DatePipe } from '@angular/common';
import { PlanejamentoAPIService } from '../../services/PlanejamentoAPI.service';
import { LoadingPopupService } from '../../services/LoadingPopup.service';

@Component({
  selector: 'app-virtual-date-simulation',
  imports: [DatePipe, AsyncPipe],
  templateUrl: './virtual-date-simulation.component.html',
  styleUrl: './virtual-date-simulation.component.css'
})
export class VirtualDateSimulationComponent implements OnInit {
  constructor(
    private dateStore: VirtualDateStoreService,
    private popup: LoadingPopupService,
    private planejamento: PlanejamentoAPIService) { }

  date$!: Observable<Date | null>

  onReplanejar(): void {
    const $ = this.planejamento.requestReplanejamento();
    this.popup.showWhile($);
    this.dateStore.loadCurrentDate();
  }

  onNext(): void {
    this.dateStore.nextDate();
  }

  onLast(): void {
    this.dateStore.lastDate();
  }

  ngOnInit(): void {
    this.date$ = this.dateStore.getDate$()
  }
}
