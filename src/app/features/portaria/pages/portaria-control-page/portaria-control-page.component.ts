import { Component, inject, OnDestroy, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import {
  PortariaStoreService,
  VeiculoDTO,
  VeiculoStatusEnum
} from '@/app/features/portaria/store/PortariaStore.service';
import { KpiCardVeiculosComponent } from '@/app/features/portaria/components/kpi-card-veiculos/kpi-card-veiculos.component';
import { FluxoHeatmapChartComponent } from '@/app/features/portaria/components/fluxo-heatmap-chart/fluxo-heatmap-chart.component';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';
import { debounceTime, distinctUntilChanged, startWith, tap, map } from 'rxjs';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { PortariaHistoricoPopupComponent } from '@/app/features/portaria/components/portaria-historico-popup/portaria-historico-popup.component';
import { SkeletonModule } from 'primeng/skeleton';
import { PaginatorModule } from 'primeng/paginator';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { SelectButtonModule } from 'primeng/selectbutton';
import { VideoStreamComponent } from '@/app/features/portaria/components/video-stream/video-stream.component';
import { PortariaWsService } from '@/app/features/portaria/stream/PortariaWs.service';

@Component({
  selector: 'app-portaria-control-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    KpiCardVeiculosComponent,
    FluxoHeatmapChartComponent,
    PageLayoutComponent,
    TableDynamicComponent,
    SkeletonModule,
    PaginatorModule,
    VideoStreamComponent,
    SelectButtonModule
  ],
  templateUrl: './portaria-control-page.component.html',
  styleUrl: './portaria-control-page.component.css'
})
export class PortariaControlPageComponent implements OnInit, OnDestroy {
  private portariaStore = inject(PortariaStoreService);
  private portariaWs = inject(PortariaWsService);
  private fb = inject(FormBuilder);
  private popup = inject(LoadingPopupService);

  @ViewChild(VideoStreamComponent) videoStream!: VideoStreamComponent;

  // State Management
  veiculoStatusOptions = Object.values(VeiculoStatusEnum);
  page = signal(0);
  first = signal(0);
  rows = signal(10);
  totalRecords = signal(0);
  refreshTrigger = signal(0);
  viewMode = signal<'INTERNOS' | 'EXTERNOS' | 'LOG'>('LOG');

  // Filter Form
  filterForm: FormGroup = this.fb.group({
    placa: [''],
    status: [''],
    modelo: [''],
    startDate: [''],
    endDate: ['']
  });

  // Filters signal derived from form value changes
  filters = toSignal(
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value),
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => {
        this.page.set(0);
        this.first.set(0);
      })
    ),
    { initialValue: this.filterForm.value }
  );

  // External refresh signal (e.g. from SSE)
  externalRefresh = toSignal(this.portariaStore.refresh$.pipe(map(() => Math.random())), { initialValue: 0 });

  // KPIs Resource
  kpisResource = rxResource({
    request: () => ({
      filters: this.filters(),
      refresh: this.refreshTrigger(),
      external: this.externalRefresh()
    }),
    loader: ({ request }) => this.portariaStore.getKPIs(request.filters)
  });

  // Vehicles Resource
  veiculosResource = rxResource({
    request: () => ({
      filters: this.filters(),
      page: this.page(),
      rows: this.rows(),
      refresh: this.refreshTrigger(),
      external: this.externalRefresh()
    }),
    loader: ({ request }) => this.portariaStore.listarVeiculos({
      ...this.normalizeFilters(request.filters),
      page: request.page,
      limit: request.rows
    }).pipe(
      tap(res => this.totalRecords.set(res.total))
    )
  });

  // Helper compute for data
  veiculosData = computed(() => this.veiculosResource.value()?.data || []);
  kpisData = computed(() => this.kpisResource.value());

  // Table Configs
  vehicleTableConfig: TableModel = {
    title: 'Monitor de Pátio',
    totalize: false,
    columns: [
      { alias: 'Foto', field: 'fotoUrl', isImg: true },
      { alias: 'Placa', field: 'placa' },
      { alias: 'Modelo', field: 'modelo' },
      { alias: 'Status', field: 'status_atual' },
      { alias: 'Última Movimentação', field: 'ultima_movimentacao', isDate: true },
      {
        alias: 'Ações',
        field: 'acoes',
        isButton: true,
        button: {
          label: 'Histórico',
          icon: 'pi pi-history',
          command: (row: VeiculoDTO) => this.showDetail(row.placa)
        }
      }
    ],

  };

  constructor() {
    // Sincroniza o viewMode com as mudanças no formulário
    this.filterForm.get('status')?.valueChanges.subscribe((status: string | null) => {
      if (status === VeiculoStatusEnum.DENTRO) this.viewMode.set('INTERNOS');
      else if (status === VeiculoStatusEnum.FORA) this.viewMode.set('EXTERNOS');
      else if (!status) this.viewMode.set('LOG');
    });
  }

  ngOnInit() {
    this.portariaWs.connect();
  }

  ngOnDestroy(): void {
    this.portariaWs.disconnect();
  }

  onViewModeChange(event: any) {
    const mode = event.value;
    if (!mode) return;

    this.viewMode.set(mode);
    const statusValue = mode === 'INTERNOS' ? VeiculoStatusEnum.DENTRO : (mode === 'EXTERNOS' ? VeiculoStatusEnum.FORA : '');
    this.filterForm.patchValue({ status: statusValue });
  }

  showDetail(placa: string) {
    this.popup.showPopUpComponent(PortariaHistoricoPopupComponent, {
      selectedVehicle: placa
    }, { size: 'xl' });
  }

  onPageChange(event: any) {
    const nextRows = event.rows ?? this.rows();
    const nextFirst = event.first ?? 0;

    this.first.set(nextFirst);
    this.rows.set(nextRows);
    this.page.set(Math.floor(nextFirst / nextRows));
  }

  refreshKPIs() {
    this.refreshTrigger.update(v => v + 1);
  }

  clearFilters() {
    this.page.set(0);
    this.first.set(0);
    this.filterForm.reset({
      placa: '',
      status: '',
      modelo: '',
      startDate: '',
      endDate: ''
    });
  }

  paginatorFirst = computed(() => this.first());

  private normalizeFilters(filters: any) {
    return {
      ...filters,
      placa: filters?.placa?.trim() || '',
      modelo: filters?.modelo?.trim() || '',
      startDate: filters?.startDate || '',
      endDate: filters?.endDate || ''
    };
  }

  onToggleFullscreen() {
    this.videoStream?.toggleFullscreen();
  }

  onRefreshStream() {
    this.videoStream?.retry();
  }
}
