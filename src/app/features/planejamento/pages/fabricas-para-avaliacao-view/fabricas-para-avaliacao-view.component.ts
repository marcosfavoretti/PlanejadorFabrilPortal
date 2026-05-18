import { FabricaAvaliacaoStartupService } from '@/app/features/planejamento/services/FabricaAvaliacaoStartup.service';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TabelaFabricaParaAvaliacaoComponent } from '@/app/features/planejamento/widgets/tabela-fabrica-para-avaliacao/tabela-fabrica-para-avaliacao.component';

@Component({
  selector: 'app-fabricas-para-avaliacao-view',
  imports: [TabelaFabricaParaAvaliacaoComponent],
  templateUrl: './fabricas-para-avaliacao-view.component.html',
  styleUrl: './fabricas-para-avaliacao-view.component.css'
})
export class FabricasParaAvaliacaoViewComponent
  implements OnInit, OnDestroy {
  startup = inject(FabricaAvaliacaoStartupService);

  ngOnInit(): void {
    this.startup.startup();
  }

  ngOnDestroy(): void {
    this.startup.shutDown();
  }
}
