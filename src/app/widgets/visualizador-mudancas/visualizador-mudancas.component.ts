import { MudancasResDtoMudancaEnum } from '@/api';
import { FabricaService } from '@/app/services/Fabrica.service';
import { FabricaMudancaStore } from '@/app/services/FabricaMudancaStore.service';
import { Component, inject, OnInit } from '@angular/core';

@Component({
  selector: 'app-visualizador-mudancas',
  imports: [],
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
