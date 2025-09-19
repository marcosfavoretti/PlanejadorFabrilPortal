import { FabricaAvaliacaoStartUpService } from '@/app/services/FabricaAvaliacaoStartUp.service';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TabelaFabricaParaAvaliacaoComponent } from "../tabela-fabrica-para-avaliacao/tabela-fabrica-para-avaliacao.component";

@Component({
  selector: 'app-fabricas-para-avaliacao-view',
  imports: [TabelaFabricaParaAvaliacaoComponent],
  templateUrl: './fabricas-para-avaliacao-view.component.html',
  styleUrl: './fabricas-para-avaliacao-view.component.css'
})
export class FabricasParaAvaliacaoViewComponent
  implements OnInit, OnDestroy {
  startup = inject(FabricaAvaliacaoStartUpService);

  ngOnInit(): void {
    this.startup.startUp();
  }

  ngOnDestroy(): void {
    this.startup.shutDown();
  }
}
