import { Component, effect, ElementRef, inject, Input, OnInit, viewChild, ViewChild } from '@angular/core';
import { FabricaResponseDto, KPIControllerGetGanttInformationMethodQueryParamsColorirEnum } from '../../../api';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { tap } from 'rxjs';
import Gantt from 'frappe-gantt';
import { EdicaoDePlanejamentoPopUpComponent } from '../edicao-de-planejamento-pop-up/edicao-de-planejamento-pop-up.component';
import { GanttStoreService } from '@/app/services/GanttStore.service';
import { OqColorirGantt } from '@/@core/enum/OqColorirGantt.enum';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-gantt-chart',
  imports: [
    CommonModule
  ],
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.css'
})
export class GanttChartComponent implements OnInit {

  ganttElement = viewChild<ElementRef>('gantt');
  ganttStore = inject(GanttStoreService);
  popup = inject(LoadingPopupService);
  fabricaContext = inject(ContextoFabricaService);
  //
  viewModeOp = Object.entries(KPIControllerGetGanttInformationMethodQueryParamsColorirEnum);
  viewMode: KPIControllerGetGanttInformationMethodQueryParamsColorirEnum = KPIControllerGetGanttInformationMethodQueryParamsColorirEnum.operacao;
  //

  @Input() editavel: boolean = false;
  @Input('Fabrica') fabrica!: FabricaResponseDto;

  setViewMode(ev: KPIControllerGetGanttInformationMethodQueryParamsColorirEnum): void {
    this.ganttStore.viewMode = ev;
    this.viewMode = ev;
    this.consultarGantt();
  }

  ganttEffect = effect(() => {
    this.generateChart();
  });

  private generateChart(): void {
    const el = this.ganttElement()?.nativeElement;
    el.innerHTML = '';
    if (!el) return;

    const gantt = new Gantt(
      el,
      this.ganttStore.item()?.data || [],
      {
        view_mode: 'Day',
        date_format: 'YYYY-MM-DD',
        column_width: 500,
        bar_height: 15,
        container_height: 1500,
        infinite_padding: false,
        lines: 'both',
        auto_move_label: false,
        padding: 0,
        
      }
    );
    if (this.editavel) {
      gantt.options.on_click = (ev) => 
        this.showEdicaoPopUP(JSON.parse(ev.dependencies as string));
    }
  }

  private showEdicaoPopUP(row: any): void {
    this.popup.showPopUpComponent(EdicaoDePlanejamentoPopUpComponent, {
      planejamento: row
    })
  }

  consultarGantt(): void {
    const gantt$ = this.ganttStore
      .refreshGantt(
        this.fabricaContext.getFabrica().fabricaId
      )
      .pipe(
        tap(() => this.generateChart())
      );
    this.popup.showWhile(gantt$);
  }

  ngOnInit(): void {
    this.consultarGantt();
  }
}
