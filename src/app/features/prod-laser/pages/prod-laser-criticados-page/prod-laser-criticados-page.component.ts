import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ProducaoFabricaControllerListQueryParamsTipRegistroEnum, ProducaoFabricaResumoDto } from '@/api/proucao-fabrica';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';
import { ProducaoFabricaApiService } from '../../services/producao-fabrica-api.service';

@Component({
  selector: 'app-prod-laser-criticados-page',
  standalone: true,
  imports: [CommonModule, PageLayoutComponent, TableDynamicComponent],
  templateUrl: './prod-laser-criticados-page.component.html',
  styleUrl: './prod-laser-criticados-page.component.css',
})
export class ProdLaserCriticadosPageComponent implements OnInit {
  private readonly producaoFabricaApi = inject(ProducaoFabricaApiService);

  protected readonly plans = signal<ProducaoFabricaResumoDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly total = signal(0);

  protected readonly tableModel: TableModel = {
    title: 'Programas criticados',
    paginator: true,
    totalize: false,
    dataKey: 'numPrograma',
    sortField: 'numPrograma',
    sortOrder: -1,
    columns: [
      { alias: 'Programa', field: 'numPrograma', filterActive: true },
      { alias: 'Código do item', field: 'codItemCompon', filterActive: true },
      { alias: 'Peso total (kg)', field: 'pesoTotal', isNumber: true },
      { alias: 'Tempo de corte (min)', field: 'tempoCorteProg', isNumber: true },
      { alias: 'Metro linear (mm)', field: 'mmLinear', isNumber: true },
    ],
  };

  ngOnInit(): void {
    this.loadCriticados();
  }

  protected loadCriticados(): void {
    this.loading.set(true);
    this.error.set(null);
    this.producaoFabricaApi.listarPlanosDisponiveis({
      page: 0,
      limit: 100,
      tipRegistro: ProducaoFabricaControllerListQueryParamsTipRegistroEnum.C,
    }).subscribe({
      next: (response) => {
        this.plans.set(response.data);
        this.total.set(response.total);
      },
      error: () => this.error.set('Não foi possível carregar os programas criticados.'),
      complete: () => this.loading.set(false),
    });
  }
}
