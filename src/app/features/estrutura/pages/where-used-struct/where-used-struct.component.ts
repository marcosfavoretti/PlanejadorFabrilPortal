import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';
import type { ResEstruturaDependentesDTO } from '@/api/estrutura';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { catchError, of, tap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { EstruturaContextService } from '@/app/features/estrutura/services/EstruturaContext.service';

@Component({
  selector: 'app-where-used-struct',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    ProgressSpinnerModule,
    TableDynamicComponent,
  ],
  templateUrl: './where-used-struct.component.html',
  styleUrl: './where-used-struct.component.css'
})
export class WhereUsedStructComponent {
  private readonly estruturaApi = inject(EstruturaApiService);
  private readonly estruturaContext = inject(EstruturaContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  searchQuery = '';
  partcode?: string;
  loading = false;
  errorMessage?: string;
  hasRequestedData = false;
  response?: ResEstruturaDependentesDTO;

  readonly tableModel: TableModel = {
    title: 'Estruturas Dependentes',
    paginator: true,
    totalize: false,
    sortField: 'partcode',
    sortOrder: 1,
    columns: [
      { alias: 'Partcode', field: 'partcode' },
      { alias: 'Descrição', field: 'itemCliente' },
      { alias: 'Status', field: 'status', isTag: true, tagSeverityFn: (value) => this.getSeverity(value) },
      { alias: 'Controle', field: 'ehControleLabel' },
    ]
  };

  constructor() {
    const partcode = this.route.snapshot.queryParamMap.get('partcode') ?? this.estruturaContext.getPartcode();
    if (partcode) {
      this.searchQuery = partcode;
      this.search();
    }
  }

  get dependencies(): Array<Record<string, unknown>> {
    return (this.response?.depedencias ?? []).map(item => ({
      ...item,
      ehControleLabel: item.ehControle ? 'Sim' : 'Nao',
    }));
  }

  get controlledDependenciesCount(): number {
    return this.dependencies.filter(item => item['ehControleLabel'] === 'Sim').length;
  }

  get target() {
    return this.response?.target;
  }

  search(): void {
    const partcode = this.searchQuery.trim().toUpperCase();
    if (!partcode || partcode.length < 5) return;

    this.partcode = partcode;
    this.searchQuery = partcode;
    this.estruturaContext.setPartcode(partcode);
    this.loading = true;
    this.errorMessage = undefined;
    this.hasRequestedData = true;
    this.response = undefined;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { partcode },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.estruturaApi.getWhereItemIsUsed(partcode)
      .pipe(
        tap((response) => {
          this.response = response;
          this.loading = false;
        }),
        catchError((error) => {
          console.error('Erro ao carregar dependencias da estrutura:', error);
          this.errorMessage = 'Nao foi possivel carregar onde este item e utilizado.';
          this.loading = false;
          return of(undefined);
        })
      )
      .subscribe();
  }

  goTo(page: 'consultar' | 'analise'): void {
    if (!this.partcode) return;
    this.estruturaContext.setPartcode(this.partcode);
    this.router.navigate([`/estrutura/${page}`], {
      queryParams: { partcode: this.partcode }
    });
  }

  getSeverity(status?: string): string {
    if (!status) return 'secondary';

    const value = status.toLowerCase();
    if (value.includes('produzido') || value === 'pa') return 'success';
    if (value.includes('comprado') || value === 'c') return 'warn';
    if (value.includes('fantasma') || value === 't') return 'info';
    if (value.includes('critico')) return 'danger';
    return 'info';
  }
}
