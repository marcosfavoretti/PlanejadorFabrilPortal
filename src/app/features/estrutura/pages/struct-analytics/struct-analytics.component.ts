import { Component, QueryList, ViewChildren, type OnInit } from '@angular/core';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';
import type { GetAnaliseResDTO } from '@/api/estrutura';
import { catchError, of, tap } from 'rxjs';
import { groupItemsBySector } from '../../utils/groupItemsBySector';
import { sectorTables } from './consts/sector-table-struct';
import { Sectors } from '@/@core/enums/sectors';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ScrollTopModule } from 'primeng/scrolltop';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';
import { ActivatedRoute, Router } from '@angular/router';
import { TableDynamicComponent } from "@/app/shared/components/table-dynamic/table-dynamic.component";
import { EstruturaContextService } from '@/app/features/estrutura/services/EstruturaContext.service';

@Component({
  selector: 'app-struct-analytics',
  templateUrl: './struct-analytics.component.html',
  styleUrls: ['./struct-analytics.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    TooltipModule,
    InputTextModule,
    FormsModule,
    DropdownModule,
    InputSwitchModule,
    ScrollTopModule,
    TableDynamicComponent,
  ]

})
export class StructAnalyticsComponent implements OnInit {

  constructor(
    private service: EstruturaApiService,
    private route: ActivatedRoute,
    private router: Router,
    private estruturaContext: EstruturaContextService
  ) { }
  data!: GetAnaliseResDTO[];
  originalSectorsData: [string, Record<string, unknown>[]][] = [];
  filteredSectorsData: [string, Record<string, unknown>[]][] = [];
  tablesModel: TableModel[] = sectorTables
  refreshing?: boolean;
  errorMessage?: string;
  hasRequestedData = false;
  partcode?: string;
  searchQuery = '';
  selectedStatus = 'all';
  filterTimeGtZero = false;
  statusOptions: { label: string; value: string }[] = [];

  get isAnyFilterActive(): boolean {
    return this.selectedStatus !== 'all' || this.filterTimeGtZero;
  }

  @ViewChildren('tables') tables!: QueryList<TableDynamicComponent>;

  ngOnInit() {
    const partcode = this.route.snapshot.queryParamMap.get('partcode') ?? this.estruturaContext.getPartcode();
    if (partcode) {
      this.partcode = partcode;
      this.searchQuery = partcode;
      this.requestData(partcode);
    }
  }

  search() {
    const partcode = this.searchQuery.trim().toUpperCase();
    if (!partcode || partcode.length < 5) return;
    this.requestData(partcode);
  }

  private readonly sectorConfigs: Record<string, { color: string, icon: string, label: string }> = {
    [Sectors.LASER]: { color: '#1e293b', icon: 'pi-info-circle', label: 'Corte Laser' },
    [Sectors.DOBRA]: { color: '#334155', icon: 'pi-info-circle', label: 'Dobramento' },
    [Sectors.TIPAGEM]: { color: '#475569', icon: 'pi-info-circle', label: 'Tipagem' },
    [Sectors.PONTEADEIRA]: { color: '#4b5563', icon: 'pi-info-circle', label: 'Ponteadeira' },
    [Sectors.SOLDA]: { color: '#854d0e', icon: 'pi-info-circle', label: 'Soldagem' },
    [Sectors.SOLDAROBO]: { color: '#92400e', icon: 'pi-info-circle', label: 'Solda Robô' },
    [Sectors.LIXA]: { color: '#57534e', icon: 'pi-info-circle', label: 'Lixamento' },
    [Sectors.BANHO]: { color: '#0369a1', icon: 'pi-info-circle', label: 'Banho Químico' },
    [Sectors.PINTURA]: { color: '#0f766e', icon: 'pi-info-circle', label: 'Pintura CABS' },
    [Sectors.PINTURAPO]: { color: '#115e59', icon: 'pi-info-circle', label: 'Pintura FABS' },
    [Sectors.MONTAGEM]: { color: '#064e3b', icon: 'pi-info-circle', label: 'Montagem' }
  };

  private readonly sectorOrderMask: Array<Sectors> = [
    Sectors.LASER,
    Sectors.DOBRA,
    Sectors.TIPAGEM,
    Sectors.PONTEADEIRA,
    Sectors.SOLDA,
    Sectors.SOLDAROBO,
    Sectors.LIXA,
    Sectors.BANHO,
    Sectors.PINTURA,
    Sectors.PINTURAPO,
    Sectors.MONTAGEM
  ]

  requestData(partcode: string) {
    this.partcode = partcode;
    this.searchQuery = partcode;
    this.estruturaContext.setPartcode(partcode);
    this.refreshing = true;
    this.errorMessage = undefined;
    this.hasRequestedData = true;
    this.originalSectorsData = [];
    this.filteredSectorsData = [];
    this.selectedStatus = 'all';
    this.filterTimeGtZero = false;
    this.statusOptions = [];

    // Optional: Update URL with the new partcode
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { partcode },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.service.getItemAnalytics(partcode)
      .pipe(
        tap((data) => {
          this.data = data;
          const objData = Object.entries(
            groupItemsBySector(data)
          );
          this.originalSectorsData = this.orderRequestData(objData);
          this.computeAvailableStatuses();
          this.applyFilters();
          this.refreshing = false;
        }),
        catchError((err) => {
          console.error("Error fetching item analytics:", err);
          this.refreshing = false;
          this.errorMessage = 'Não foi possível carregar a análise da estrutura.';
          return of([]);
        })
      )
      .subscribe();
  }

  findMatchTableSchema(name: string): TableModel {
    const result = this.tablesModel.find(table => table.title === name);

    if (!result) return {
      title: name,
      paginator: true,
      totalize: false,
      columns: []
    };
    return result;
  }

  orderRequestData(data: [string, Record<string, unknown>[]][]): [string, Record<string, unknown>[]][] {
    const results: [string, Record<string, unknown>[]][] = [];
    const usedIndices = new Set<number>();

    for (const sectorMask of this.sectorOrderMask) {
      const matchIndex = data.findIndex(([sector], index) => {
        if (usedIndices.has(index)) return false;
        return sector === sectorMask;
      });

      if (matchIndex !== -1) {
        results.push(data[matchIndex]);
        usedIndices.add(matchIndex);
      }
    }

    // Add remaining sectors that didn't match any mask
    data.forEach((item, index) => {
      if (!usedIndices.has(index)) {
        results.push(item);
      }
    });

    return results;
  }

  private computeAvailableStatuses(): void {
    const statusSet = new Set<string>();
    this.originalSectorsData.forEach(([, items]) => {
      items.forEach(item => {
        const status = item['item_status'];
        if (status && typeof status === 'string' && status.trim()) {
          statusSet.add(status.trim());
        }
      });
    });
    this.statusOptions = [
      { label: 'Todos', value: 'all' },
      ...Array.from(statusSet).sort().map(s => ({ label: s, value: s }))
    ];
  }

  applyFilters(): void {
    if (!this.originalSectorsData) {
      this.filteredSectorsData = [];
      return;
    }

    this.filteredSectorsData = this.originalSectorsData
      .map(([sector, items]) => {
        let filtered = items;

        if (this.selectedStatus && this.selectedStatus !== 'all') {
          filtered = filtered.filter(item => item['item_status'] === this.selectedStatus);
        }

        if (this.filterTimeGtZero) {
          filtered = filtered.filter(item => {
            const time = this.getNestedValue(item, 'sector.metrics.Total Time');
            const numericTime = Number(time);
            return !isNaN(numericTime) && numericTime > 0;
          });
        }

        return [sector, filtered] as [string, Record<string, unknown>[]];
      });
  }

  resetFilters(): void {
    this.selectedStatus = 'all';
    this.filterTimeGtZero = false;
    this.applyFilters();
  }

  scrollToSector(sector: string) {
    const element = document.getElementById('sector-' + sector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getSectorConfig(sector: string) {
    const config = this.sectorConfigs[sector];

    return config || { color: '#64748b', icon: 'pi-cog', description: 'Processamento de itens por setor.', label: sector };
  }

  calculateTotalTimeMinutes(data: Record<string, unknown>[]): number {
    return data.reduce((acc, item) => {
      const rawValue = this.getNestedValue(item, 'sector.metrics.Total Time');
      const time = typeof rawValue === 'string'
        ? Number(rawValue.replace(',', '.'))
        : Number(rawValue);

      return acc + (isNaN(time) ? 0 : time);
    }, 0);
  }

  calculateTotalTime(data: Record<string, unknown>[]): string {
    const totalMinutes = this.calculateTotalTimeMinutes(data);
    return totalMinutes.toFixed(1) + ' min';
  }

  calculateTotalTimeHours(data: Record<string, unknown>[]): string {
    const totalMinutes = this.calculateTotalTimeMinutes(data);
    return (totalMinutes / 60).toFixed(1) + ' horas';
  }

  getNestedValue(object: any, key: string): any {
    return key.split('.').reduce((acc, curr) => (acc ? acc[curr] : null), object);
  }
}
