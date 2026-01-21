import { AsyncPipe, CommonModule } from '@angular/common';
import { PontoControllerConsultaMarcacaoMethodQueryParams, ResCentroDeCustoDTO, ResHorasIrregularesDTO, ResPontoFuncionarioDTO, ResRegistroPontoTurnoPontoDTO } from '@/api/relogio';
import { RelogioPontoAPIService } from '@/app/services/RelogioPontoAPI.service';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { tableColumns, TableModel } from '@/app/table-dynamic/@core/table.model';
import { Component, computed, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { forkJoin, Observable, tap } from 'rxjs';
import { TableDynamicComponent } from "@/app/table-dynamic/table-dynamic.component";
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { isDate, isSameDay } from 'date-fns';
import { PageLayoutComponent } from "@/app/layouts/page-layout/page-layout.component";
import { FuncionariosAPIService } from '@/app/services/FuncionariosAPI.service';
import { HorasIrregularesParetoChartComponent } from "@/app/widgets/horas-irregulares-pareto-chart/horas-irregulares-pareto-chart.component";
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-relogio-pont-page',
  imports: [TableDynamicComponent, SkeletonModule, ReactiveFormsModule, CommonModule, FormsModule, PageLayoutComponent, AsyncPipe, PaginatorModule, HorasIrregularesParetoChartComponent],
  templateUrl: './relogio-pont-page.component.html',
  styleUrl: './relogio-pont-page.component.css'
})
export class RelogioPontPageComponent {
  api = inject(RelogioPontoAPIService);
  fb = inject(FormBuilder);
  funcionariosAPIService = inject(FuncionariosAPIService);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage));
  filterForm = this.fb.group({
    indetificador: [''],
    dataInicio: [''],
    dataFim: [''],
    ccid: undefined
  });
  tableData: WritableSignal<any[]> = signal([]);
  itemsPerPage = 10;
  currentPage = signal(0);
  totalItems = signal(0);
  centroDeCusto: ResCentroDeCustoDTO[] = [];
  selected_funcionario: ResPontoFuncionarioDTO[] = [];
  //
  chartHorasIrregulares: WritableSignal<ResHorasIrregularesDTO[]> = signal([]);
  fetching = {
    pareto: false,
    table: false
  }

  tableModel: TableModel = {
    paginator: false,
    title: '',
    columns: [
    ],
    ghostControll: [
      {
        color: '#eb5c5c95',
        desc: 'marcações impares',
        field: 'status',
        ifValueEqual: "INCOMPLETO"
      },
      {
        color: '#f2d38895',
        desc: 'excedido limite de 09 horas',
        field: 'status',
        ifRowFunction: (row: any) => {
          return row.horasIrregular > 0;
        }
      }
    ],
    totalize: false
  };

  ngOnInit(): void {
    forkJoin([
      this.loadHorasIrregulares(),
      this.laodCentroDeCusto(),
      this.loadData(this.currentPage())
    ]).subscribe()
  }

  search() {
    this.currentPage.set(0);
    forkJoin([
      this.loadData(this.currentPage()),
      this.loadHorasIrregulares(),
    ])
      .subscribe();
  }

  loadData(page: number): Observable<ResRegistroPontoTurnoPontoDTO[]> {
    console.log(this.filterForm.value)
    const filter = this.filterForm.value as PontoControllerConsultaMarcacaoMethodQueryParams;
    const params = {
      ...filter,
      page: page + 1,
      limit: this.itemsPerPage
    };
    return this.api.consultarPonto(params)
      .pipe(
        tap((res: any) => {
          const data = res.data || res.items || [];
          const total = res.total || res.totalItems || res.total_count || 0;
          this.processData(data);
          this.totalItems.set(total);
        })
      )
  }

  laodCentroDeCusto(): Observable<ResCentroDeCustoDTO[]> {
    const cc = this.funcionariosAPIService.getCentroDeCusto();
    return cc.pipe(
      tap(res => {
        this.centroDeCusto = res;
      })
    );
  }

  loadHorasIrregulares(): Observable<ResHorasIrregularesDTO[]> {
    const params = {
      ...this.filterForm.value as PontoControllerConsultaMarcacaoMethodQueryParams,
      page: 1,
      limit: this.itemsPerPage
    };
    this.fetching.pareto = true;
    return this.api.consultarPontosIrregularesKPI({
      ...params
    })
      .pipe(
        tap((res) => {
          const data = res || [];
          this.chartHorasIrregulares.set(data);
          this.fetching.pareto = false;
        })
      )

  }

  private processData(data: ResRegistroPontoTurnoPontoDTO[]) {
    if (!data || data.length === 0) {
      this.tableData.set([]);
      return;
    }

    let maxRegistros = 0;
    data.forEach(item => {
      if (item.registros && item.registros.length > maxRegistros) {
        maxRegistros = item.registros.length;
      }
    });

    const newColumns: tableColumns[] = [
      { alias: 'matricula', field: 'matricula' },
      { alias: 'setor', field: 'setor' },
      { alias: 'nome', field: 'nome' },
      { alias: 'Data', field: 'turnoDia', isDate: true },
      { alias: 'horas trabalhadas', field: "horasTrabalhadas" }
    ];

    for (let i = 1; i <= maxRegistros; i++) {
      newColumns.push({ alias: `Marcacao ${i}`, field: `marcacao_${i}` });
      newColumns.push({ alias: `Hora ${i}`, field: `hora_${i}` });
    }
    newColumns.push({ alias: `Status`, field: `status` });
    this.tableModel.columns = newColumns;

    const mappedData = data.map(item => {
      const newItem: any = {
        matricula: item.matricula,
        nome: item.nome,
        horasIrregular: item.horasIrregulares,
        setor: item.setor,
        horasTrabalhadas: item.qtdHoras,
        turnoDia: item.turnoDia
      };

      /** se o registro tiver marcacao par ou se for impar mas esta no dia de hoje ele deixa OK */
      newItem['status'] = !(item.registros.length % 2) || isSameDay(item.turnoDia, new Date()) ? 'OK' : 'INCOMPLETO';

      if (item.registros) {
        const sortedRegistros = [...item.registros].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        sortedRegistros.forEach((registro, index) => {
          newItem[`marcacao_${index + 1}`] = registro.marcacao;
          newItem[`hora_${index + 1}`] = new Date(registro.data).toLocaleString();
        });
      }
      return newItem;
    });

    this.tableData.set(mappedData);
  }

  onPageChange(event: PaginatorState) {
    if (event.page !== undefined) {
      this.currentPage.set(event.page); // PrimeNG is 0-indexed
      this.itemsPerPage = event.rows || 5;
      this.loadData(this.currentPage())
        .subscribe();
    }
  }
}
