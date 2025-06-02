import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import Gantt from 'frappe-gantt';
import { PlanejamentoAPIService } from '../../services/PlanejamentoAPI.service';
import { GetGanttInformationDto } from '../../../api';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-gantt-chart',
  imports: [],
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.css'
})
export class GanttChartComponent implements OnInit {
  @ViewChild('gantt', { static: true }) ganttElement!: ElementRef<SVGElement>;

  constructor(private api: PlanejamentoAPIService, private popup: LoadingPopupService) { }


  private generateChart(data: GetGanttInformationDto[]): void {

    new Gantt(this.ganttElement.nativeElement, data, {
      view_mode: 'Day',
      date_format: 'YYYY-MM-DD',
      column_width: 250,
      bar_height: 15,
      container_height: 1000,
      infinite_padding: false,
      lines: 'both',
      auto_move_label: true,
      padding: 0
    });
  }

  ngOnInit(): void {
    const gantt$ = this.api.requestGanttData()
      .pipe(tap(data => this.generateChart(data)));
    this.popup.showWhile(gantt$);
  }

}
