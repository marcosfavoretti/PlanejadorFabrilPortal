import { FabricaResponseDto } from '@/api/planejador';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { FabricaService } from '@/app/services/Fabrica.service';
import { DatePipe } from '@angular/common';
import { Component,  inject, OnInit, Signal } from '@angular/core';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { Skeleton } from 'primeng/skeleton';
import { FabricaApresentacaoBotoesComponent } from "../fabrica-apresentacao-botoes/fabrica-apresentacao-botoes.component";

@Component({
  selector: 'app-fabrica-apresentacao',
  imports: [DatePipe, ConfirmPopupModule, TooltipModule, Skeleton, FabricaApresentacaoBotoesComponent],
  providers: [ConfirmationService],
  templateUrl: './fabrica-apresentacao.component.html',
  styleUrl: './fabrica-apresentacao.component.css'
})
export class FabricaApresentacaoComponent
  implements OnInit {

  fabricaService = inject(FabricaService);
  contextoFabricaService = inject(ContextoFabricaService);

  fabrica!: Signal<FabricaResponseDto | null>

  ngOnInit(): void {
    this.fabrica = this.contextoFabricaService.item;
  }
}
