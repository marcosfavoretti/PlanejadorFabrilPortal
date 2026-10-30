import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { CategoriaHoraExtraAPIService } from '../../services/CategoriaHoraExtraAPI.service';
import { FolhaHoraExtraAPIService } from '../../services/FolhaHoraExtraAPI.service';
import { FuncionariosAPIService } from '../../services/FuncionariosAPI.service';
import { FolhaHoraExtraListPageComponent } from './folha-hora-extra-list-page.component';

describe('FolhaHoraExtraListPageComponent refeicoes x categoria', () => {
  const cat = (codigo: string | null) => codigo ? { id: codigo, codigo, nome: codigo } : null;
  const linha = (n: number, codigo: string | null) => ({ folhaId: 'f', matricula: String(n), nome: 'N' + n, categoria: cat(codigo) });
  // 250 linhas no servidor: A nas posicoes multiplas de 5, o resto B.
  const todas = Array.from({ length: 250 }, (_, i) => linha(i, i % 5 === 0 ? 'A' : 'B'));

  let component: any;
  let getRefeicoes: jasmine.Spy;
  let categoria$: Subject<void>;

  beforeEach(async () => {
    categoria$ = new Subject<void>();
    getRefeicoes = jasmine.createSpy('getRefeicoes').and.callFake((filtros: { page: number; limit: number }) => of({
      data: todas.slice(filtros.page * filtros.limit, (filtros.page + 1) * filtros.limit),
      total: todas.length, page: filtros.page, limit: filtros.limit, totalPages: Math.ceil(todas.length / filtros.limit),
    }));
    await TestBed.configureTestingModule({
      imports: [FolhaHoraExtraListPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true), getCurrentNavigation: () => null } },
        { provide: UserstoreService, useValue: { item: () => ({ cargosLista: ['RH'] }) } },
        { provide: FuncionariosAPIService, useValue: { getCentroDeCusto: () => of([]) } },
        { provide: CategoriaHoraExtraAPIService, useValue: { getTodas: () => of([]), catalogoAlterado$: categoria$ } },
        {
          provide: FolhaHoraExtraAPIService,
          useValue: { getRefeicoes, getFolhas: () => of({ data: [], total: 0 }), getFolhaById: () => of({ funcionarios: [] }) },
        },
      ],
    }).compileComponents();
    component = TestBed.createComponent(FolhaHoraExtraListPageComponent).componentInstance;
    component.ngOnInit();
    component.onRefeicoesLazyLoad({ first: 0, rows: 50 });
  });

  it('sem filtro de categoria pagina no servidor', () => {
    expect(component.refeicoesHoje.length).toBe(50);
    expect(component.refeicoesTotalRecords).toBe(250);
  });

  it('com categoria carrega tudo, filtra e pagina no cliente: linhas, total e paginador concordem', () => {
    getRefeicoes.calls.reset();
    component.refeicoesCategoriaFilter.setValue('A');

    // 250 / 100 por pagina = 3 requisicoes; 50 linhas da categoria A, todas na primeira pagina de 50.
    expect(getRefeicoes).toHaveBeenCalledTimes(3);
    expect(component.refeicoesTotalRecords).toBe(50);
    expect(component.refeicoesHoje.length).toBe(50);
    expect(component.refeicoesHoje.every((r: any) => r.categoria.codigo === 'A')).toBeTrue();
    expect(component.refeicoesFirst).toBe(0);
  });

  it('mudar de pagina com a categoria ativa reaproveita as linhas ja carregadas', () => {
    component.refeicoesPageSize = 20;
    component.refeicoesCategoriaFilter.setValue('A');
    getRefeicoes.calls.reset();

    component.onRefeicoesLazyLoad({ first: 40, rows: 20 });
    expect(getRefeicoes).not.toHaveBeenCalled();
    expect(component.refeicoesHoje.length).toBe(10);
    expect(component.refeicoesTotalRecords).toBe(50);
  });

  it('voltar a primeira pagina ao trocar o filtro', () => {
    component.onRefeicoesLazyLoad({ first: 100, rows: 50 });
    component.refeicoesCategoriaFilter.setValue('B');
    expect(component.refeicoesFirst).toBe(0);
    expect(component.refeicoesTotalRecords).toBe(200);
    expect(component.refeicoesHoje.length).toBe(50);
  });
});
