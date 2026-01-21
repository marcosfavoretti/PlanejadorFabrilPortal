import { MudancasResDtoMudancaEnum } from '@/api/planejador';
import { FabricaMudancaStore } from '@/app/services/FabricaMudancaStore.service';
import { Component, inject, OnInit } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-visualizador-mudancas',
  imports: [Skeleton],
  templateUrl: './visualizador-mudancas.component.html',
  styleUrl: './visualizador-mudancas.component.css'
})
export class VisualizadorMudancasComponent {
  visualizador = inject(FabricaMudancaStore);

  relacaoCorEMudanca: Record<MudancasResDtoMudancaEnum, string> = {
    ATUALIZACAO: 'blue',
    INSERÇÃO: 'green',
    REMOÇÃO: 'red'
  };

}
