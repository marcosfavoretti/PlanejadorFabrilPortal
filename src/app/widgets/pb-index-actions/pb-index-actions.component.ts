import { Component, inject, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PowerbiDataset } from '../powerbi-chart/@core/models/PowerbiDataset';
import { PbIndexClientWs } from '@/@core/ws/PbIndex.client';
import { TooltipModule } from 'primeng/tooltip';
import { UserstoreService } from '@/app/services/userstore.service';
import { ResAppRouteAppDTOCargosEnum } from '@/api/routes';

@Component({
  selector: 'app-pb-index-actions',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    <div class="d-flex flex-column gap-2 p-3 bg-white border-top shadow-sm mt-auto">
      <div class="small text-muted mb-1 fw-bold text-uppercase d-flex justify-content-between align-items-center" style="font-size: 0.65rem; letter-spacing: 0.05em;">
        <span>Ações do Relatório</span>
        @if (isUsing()) {
          <span class="badge rounded-pill bg-warning text-dark animate-pulse">
            <i class="pi pi-spin pi-spinner me-1"></i>Em uso
          </span>
        }
      </div>
      
      <div class="d-grid gap-2">
        <button 
          (click)="refreshReport(false)" 
          [disabled]="!selectedDataset() || isRefreshing || isUsing()"
          class="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center py-2 transition-all shadow-sm-hover position-relative overflow-hidden"
          [pTooltip]="isUsing() ? 'Relatório sendo atualizado no momento' : 'Atualizar dados como Usuário'"
          tooltipPosition="top"
        >
          <i class="pi pi-refresh me-2" [class.pi-spin]="isRefreshing || isUsing()"></i>
          <span class="fw-semibold">Atualizar</span>
          @if (isUsing()) { <div class="loading-bar"></div> }
        </button>
        @if (isUserAdminOrAdminPowerbi()) {
          <button 
            (click)="refreshReport(true)" 
            [disabled]="!selectedDataset() || isRefreshing || isUsing()"
            class="btn btn-success btn-sm d-flex align-items-center justify-content-center py-2 transition-all shadow-sm-hover position-relative overflow-hidden"
            [pTooltip]="isUsing() ? 'Relatório sendo atualizado no momento' : 'Atualização administrativa (Dataset completo)'"
            tooltipPosition="top"
          >
            <i class="pi pi-refresh me-2" [class.pi-spin]="isRefreshing || isUsing()"></i>
            <span class="fw-semibold">Atualizar Admin</span>
            @if (isUsing()) { <div class="loading-bar bg-white opacity-25"></div> }
          </button>
        }
      </div>

      @if (!selectedDataset()) {
        <div class="text-center small text-muted fst-italic mt-1" style="font-size: 0.7rem;">
          Selecione um gráfico para habilitar ações
        </div>
      }
    </div>
  `,
  styles: [`
    .transition-all {
      transition: all 0.2s ease-in-out;
    }
    .shadow-sm-hover:hover:not(:disabled) {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }
    .btn:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .5; }
    }
    .loading-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: var(--bs-success);
      width: 100%;
      animation: loading 2s linear infinite;
    }
    @keyframes loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `]
})
export class PbIndexActionsComponent {
  private ws = inject(PbIndexClientWs);
  private user = inject(UserstoreService);

  isUserAdminOrAdminPowerbi(): boolean {
    return [
      ResAppRouteAppDTOCargosEnum.ADMIN,
      ResAppRouteAppDTOCargosEnum.ADMIN_POWERBI_VIEW,
      ResAppRouteAppDTOCargosEnum.ADMIN_POWERBI
    ]
    .some(cargo => this.user.item()?.cargosLista.includes(cargo));
  }

  selectedDataset = input<PowerbiDataset | undefined>();
  currentStatus = input<any>(); // Recebe o status do pai

  isRefreshing = false;

  // Computed para verificar se o sistema está em uso
  isUsing = computed(() => this.currentStatus()?.using === true);

  async refreshReport(isAdmin: boolean) {
    const dataset = this.selectedDataset();
    if (!dataset || this.isUsing()) return;

    this.isRefreshing = true;

    if(isAdmin && !this.isUserAdminOrAdminPowerbi()) throw new Error('ação não permitida');

    try {
      await this.ws.requestPowerbiRefresh({
        datasetID: dataset.PowerbiDatasetsID,
        admin: isAdmin
      });

      // Feedback temporário local enquanto o socket não retorna
      setTimeout(() => {
        this.isRefreshing = false;
      }, 2000);

    } catch (error) {
      console.error('Erro ao solicitar atualização:', error);
      this.isRefreshing = false;
    }
  }
}
