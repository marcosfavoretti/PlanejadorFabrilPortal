import { Component, effect, ElementRef, inject, input, OnInit, viewChild, ViewChild } from '@angular/core';
import { GanttData, KPIControllerGetGanttInformationMethodQueryParamsColorirEnum } from '../../../api/planejador';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { tap } from 'rxjs';
import Gantt from 'frappe-gantt';
import { EdicaoDePlanejamentoPopUpComponent } from '../edicao-de-planejamento-pop-up/edicao-de-planejamento-pop-up.component';
import { GanttStoreService } from '@/app/services/GanttStore.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { addMonths, min, startOfToday } from 'date-fns';
import { Skeleton } from 'primeng/skeleton';
@Component({
  selector: 'app-gantt-chart',
  imports: [
    CommonModule,
    FormsModule,
    Skeleton
  ],
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.css'
})
export class GanttChartComponent implements OnInit {

  public readonly ganttStore = inject(GanttStoreService);
  private readonly popup = inject(LoadingPopupService);
  private readonly contextoFabrica = inject(ContextoFabricaService);

  ganttElement = viewChild<ElementRef>('gantt');

  viewModeOp = Object.entries(KPIControllerGetGanttInformationMethodQueryParamsColorirEnum);

  viewMode: KPIControllerGetGanttInformationMethodQueryParamsColorirEnum = KPIControllerGetGanttInformationMethodQueryParamsColorirEnum.operacao;

  loadingRequest: boolean = false

  ganttEffect = effect(() => {
    const data = this.ganttStore.item()?.data || [];
    this.generateChart(data);
  });

  editavel = input<boolean>(false);

  setViewMode(ev: KPIControllerGetGanttInformationMethodQueryParamsColorirEnum): void {
    [this.ganttStore.viewMode, this.viewMode] = [ev, ev];
    if (!this.contextoFabrica.item()) return;
    this.loadingRequest = true
    this.ganttStore.refresh(this.contextoFabrica.item()!.fabricaId)
      .pipe(
        tap(() => {
          this.loadingRequest = false
        })
      )
      .subscribe();
  }

  private generateChart(fiterData?: GanttData[]): void {
    const el = this.ganttElement()?.nativeElement;
    el.innerHTML = '';
    if (!el) return;
    const dates = (fiterData?.map(f => new Date(f.start))
      || this.ganttStore.item()?.data.map(b => new Date(b.start))
    ) || [];
    const minDate = dates.length > 0
      ? new Date(Math.min(...dates.map(d => d.getTime())))
      : undefined;
    const gantt = new Gantt(
      el,
      (fiterData || this.ganttStore.item()?.data || [])
        .concat(this.archorTask(addMonths(startOfToday(), 2))),
      {
        view_mode: 'Day',
        date_format: 'YYYY-MM-DD',
        
        // ================== ALTERAÇÕES CRÍTICAS ==================
        // 1. Reduza drasticamente a largura da coluna. Um valor entre 30 e 50 é o ideal para a visão diária.
        column_width: 400, 
        
        // 2. Remova a altura do contêiner daqui. O CSS vai cuidar disso.
        container_height: 500,
        // =========================================================

        bar_height: 15,
        infinite_padding: false,
        on_date_change: (task, start, end) =>
          console.log(`data mudou para ${task} ${start} `),
        move_dependencies: true,
        lines: 'both',
        auto_move_label: true,
        snap_at: '1d',
        view_mode_select: true,
        padding: 0,
        scroll_to: minDate
      }
    );
    if (this.editavel()) {
      gantt.options.on_click = (ev) => {
        this.showEdicaoPopUP(JSON.parse(ev.dependencies as string));
      }
    }
  
  }

  private archorTask(lastDay: Date): GanttData {
    return {

      id: 'anchor_task_for_view_extension',
      color: 'transparent',
      name: '',
      dependencies: [],
      start: lastDay.toISOString(),
      end: lastDay.toISOString(),
      custom_class: 'gantt-bar-hidden',
      progress: 0,
    } as GanttData;
  }

  private showEdicaoPopUP(row: any): void {
    this.popup.showPopUpComponent(EdicaoDePlanejamentoPopUpComponent, {
      planejamento: row
    })
  }

  ngOnInit(): void {
    this.generateChart();
  }
}
