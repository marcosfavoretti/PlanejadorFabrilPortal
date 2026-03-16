import { Component, signal, OnInit, OnDestroy, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PowerbiChartComponent } from "@/app/widgets/powerbi-chart/powerbi-chart.component";
import { PowerbiDataset } from '@/app/widgets/powerbi-chart/@core/models/PowerbiDataset';
import { PbIndexClientWs, wsStatus } from '@/@core/ws/PbIndex.client';
import { ActivatedRoute, Router } from '@angular/router';
import { TitleModifyService } from '@/app/services/TitleModify.service';
import { PowerBIChartsStoreServices } from '@/app/services/PowerbiChartStore.service';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { PopupRefreshDonePbIndexComponent } from '@/app/widgets/popup-refresh-done-pb-index/popup-refresh-done-pb-index.component';
import { PbIndexStartUp } from '@/app/services/PbIndexStartup.service';
import { PageLayoutComponent } from "@/app/layouts/page-layout/page-layout.component";
import { takeUntil } from 'rxjs/operators';
import { Subject, interval } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { PopoverModule } from 'primeng/popover';
import { PbIndexApiService } from '@/app/services/PbIndexApi.service';

import { PbIndexActionsComponent } from "@/app/widgets/pb-index-actions/pb-index-actions.component";

@Component({
  selector: 'app-pb-index-page',
  imports: [PowerbiChartComponent, CommonModule, PageLayoutComponent, PbIndexActionsComponent, PopoverModule],
  templateUrl: './pb-index-page.component.html',
  styleUrl: './pb-index-page.component.css'
})
export class PbIndexPageComponent implements OnInit, OnDestroy {
  currentStatus?: wsStatus;
  currentConnection: boolean = false;

  // List of users connected fetched from API
  connectedUsers = signal<string[]>([]);

  // Mobile sidebar state
  isMobileSidebarHidden = true;
  isDesktop = true;

  router = inject(Router)
  private destroy$ = new Subject<void>();

  // Use inject for dependency injection
  private pbIndexStartup = inject(PbIndexStartUp);
  public chartStore = inject(PowerBIChartsStoreServices);
  private routeActive = inject(ActivatedRoute);
  public ws = inject(PbIndexClientWs);
  private tittle = inject(TitleModifyService);
  private popUp = inject(LoadingPopupService);
  // private localStorage = inject(LocalStorageService);
  private api = inject(PbIndexApiService);

  // Convert observables to signals
  readonly routeParams = toSignal(this.routeActive.params);

  // Computed signal for current active grafico ID
  readonly currentGraficoId = computed(() => {
    const params = this.routeParams();
    return params ? params['grafico'] : undefined;
  });

  navigateTo(path: string):void{
    this.router.navigate([path]);
  }

  // Computed signal for pickedDataset
  readonly pickedChartComputed = computed<PowerbiDataset | undefined>(() => {
    const data = this.chartStore.item();
    const graficoParam = this.currentGraficoId();
    if (!graficoParam || !data || !data.length) {
        return undefined;
    }
    return data.find(chart => chart.PowerbiDatasetsID.toString() === graficoParam.toString());
  });

  constructor() {
    // Effect to react to changes in pickedChartComputed
    effect(() => {
        const currentPickedChart = this.pickedChartComputed();
        const graficoParam = this.currentGraficoId();

        // Update the service's pickedDataset property
        this.chartStore.pickedDataset = currentPickedChart;

        // Update title and buffer
        if (currentPickedChart) {
            this.tittle.setTitle(currentPickedChart.name);
            this.chartStore.addToBuffer(currentPickedChart);
        } else if (graficoParam) {
            this.tittle.setTitle('Gráfico não encontrado');
        } else {
             this.tittle.setTitle('');
        }
    });
  }

  ngOnInit() {
    this.pbIndexStartup.startUp(); // This triggers the refresh and chartStore.$onChange

    this.currentConnection = this.ws.isConnect;
    this.ws.onRefresh
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: string) => {
          this.popUp.showPopUpComponent(PopupRefreshDonePbIndexComponent, { describe: data })
        }
      );
    this.ws.onStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.currentStatus = data.stt;
          this.currentConnection = data.connection;
        }
      );

    // Check screen size on init and on resize
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    // Initial fetch and periodic refresh of connected users
    this.updateConnectedUsers();
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateConnectedUsers());
  }

  private checkScreenSize(): void {
    this.isDesktop = window.innerWidth >= 768;
    if (this.isDesktop) {
      this.isMobileSidebarHidden = false; // Show sidebar on desktop
    }
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarHidden = !this.isMobileSidebarHidden;
  }

  private updateConnectedUsers() {
    this.api.listUsers().subscribe({
      next: (users) => this.connectedUsers.set(users),
      error: (err) => console.error('Erro ao buscar usuários conectados:', err)
    });
  }

  ngOnDestroy(): void {
    this.pbIndexStartup.shutDown();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
