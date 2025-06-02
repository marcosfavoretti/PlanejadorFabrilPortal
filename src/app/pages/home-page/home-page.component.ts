import { Component } from '@angular/core';
import { ContextoSimulacaoComponent } from "../../widgets/contexto-simulacao/contexto-simulacao.component";
import { GanttChartComponent } from "../../widgets/gantt-chart/gantt-chart.component";
import { VirtualDateSimulationComponent } from "../../widgets/virtual-date-simulation/virtual-date-simulation.component";

@Component({
  selector: 'app-home-page',
  imports: [ContextoSimulacaoComponent, GanttChartComponent, VirtualDateSimulationComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent {
    

}
