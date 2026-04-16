import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { 
  PortariaStoreService, 
  VeiculoDTO, 
  MovimentacaoDTO, 
  VeiculoStatusEnum 
} from '@/app/services/PortariaStore.service';
import { TableDynamicComponent } from '@/app/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/table-dynamic/@core/table.model';
import { SkeletonModule } from 'primeng/skeleton';
import { PaginatorModule } from 'primeng/paginator';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, tap } from 'rxjs';

@Component({
  selector: 'app-portaria-historico-popup',
  standalone: true,
  imports: [CommonModule, TableDynamicComponent, DatePipe, SkeletonModule, PaginatorModule],
  templateUrl: './portaria-historico-popup.component.html',
  styleUrl: './portaria-historico-popup.component.css'
})
export class PortariaHistoricoPopupComponent {
  private portariaStore = inject(PortariaStoreService);

  @Input() selectedVehicle!: string | null;
  @Input() closeButtonFn!: () => void;

  // Pagination State
  page = signal(1);
  rows = signal(10);
  totalRecords = signal(0);

  // History Resource
  historyResource = rxResource({
    request: () => ({
      placa: this.selectedVehicle,
      page: this.page(),
      limit: this.rows()
    }),
    loader: ({ request }) => {
      if (!request.placa) return of(null);
      return this.portariaStore.getDetalheVeiculo(
        request.placa,
        request.page,
        request.limit
      ).pipe(
        tap(res => this.totalRecords.set(res.total))
      );
    }
  });

  // Computed data
  data = computed(() => this.historyResource.value());

  historyTableConfig: TableModel = {
    title: 'Histórico de Movimentação',
    totalize: false,
    columns: [
      { alias: 'FOTO', field: 'fotoUrl', isImg: true },
      { alias: 'EVENTO', field: 'evento' },
      { alias: 'DATA/HORA', field: 'timestamp', isDate: true },
      { alias: 'PERMANÊNCIA (MIN)', field: 'permanencia_minutos' },
      {
        alias: 'AÇÃO', field: 'acao', isButton: true, button: {
          label: '',
          icon: 'pi pi-eye',
          command: (row) => console.log('Visualizar', row)
        }
      }
    ]
  };

  onPageChange(event: any) {
    this.page.set(event.page + 1);
    this.rows.set(event.rows);
  }

  calcMedia(historico: MovimentacaoDTO[]): string {
    const values = historico.filter(m => m.permanencia_minutos).map(m => m.permanencia_minutos!);
    return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length).toString() : '0';
  }

  isOcioso(veiculo: VeiculoDTO): boolean {
    if (veiculo.status_atual !== VeiculoStatusEnum.DENTRO) return false;
    const diff = (new Date().getTime() - new Date(veiculo.ultima_movimentacao).getTime()) / 3600000;
    return diff > 4;
  }
}
