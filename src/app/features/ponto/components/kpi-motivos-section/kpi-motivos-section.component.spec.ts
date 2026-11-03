import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject, of } from 'rxjs';
import { CategoriaHoraExtraAPIService } from '../../services/CategoriaHoraExtraAPI.service';
import { FolhaHoraExtraAPIService } from '../../services/FolhaHoraExtraAPI.service';
import { KpiMotivosSectionComponent } from './kpi-motivos-section.component';

function folha(id: string, categorias: Array<[string | null, string, number]>) {
  return {
    id, dataContexto: '2026-07-01', setor: 'S' + id, centroCustoCodigo: 1, centroCustoDescricao: 'CC', autorNome: 'Ana',
    totalFuncionarios: categorias.reduce((soma, [, , qtd]) => soma + qtd, 0),
    categorias: categorias.map(([codigo, nome, quantidadeFuncionarios]) => ({ codigo, nome, quantidadeFuncionarios })),
    motivos: [],
  };
}

describe('KpiMotivosSectionComponent', () => {
  let component: any;
  let consultas: Subject<unknown>[];
  let getKpiMotivos: jasmine.Spy;
  let fixture: any;

  beforeEach(async () => {
    consultas = [];
    getKpiMotivos = jasmine.createSpy('getKpiMotivos').and.callFake(() => {
      const consulta = new Subject<unknown>();
      consultas.push(consulta);
      return consulta;
    });
    await TestBed.configureTestingModule({
      imports: [KpiMotivosSectionComponent],
      providers: [
        provideNoopAnimations(),
        { provide: FolhaHoraExtraAPIService, useValue: { getKpiMotivos } },
        { provide: CategoriaHoraExtraAPIService, useValue: { getTodas: () => of([]), catalogoAlterado$: new Subject<void>() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(KpiMotivosSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const resposta = (data: unknown[], total = data.length) => ({ data, total, page: 0, limit: 10, totalPages: 1 });

  it('soma os totais por categoria das folhas da pagina (Sem categoria em separado)', () => {
    consultas[0].next(resposta([
      folha('1', [['A', 'Alfa', 2], [null, 'Sem categoria', 1]]),
      folha('2', [['A', 'Alfa', 3], ['B', 'Beta', 1]]),
    ]));
    expect(component.totaisPeriodo().map((t: any) => [t.codigo, t.quantidadeFuncionarios]))
      .toEqual([['A', 5], ['B', 1], [null, 1]]);
    expect(component.totalFuncionariosPagina()).toBe(7);
    expect(component.loading()).toBeFalse();
  });

  it('ignora a resposta de um pedido antigo quando um novo foi disparado', () => {
    component.aplicar();
    expect(consultas.length).toBe(2);

    consultas[1].next(resposta([folha('novo', [['A', 'Alfa', 1]])]));
    consultas[0].next(resposta([folha('velho', [['B', 'Beta', 9]])]));

    expect(component.resposta().data[0].id).toBe('novo');
    expect(component.loading()).toBeFalse();
  });

  it('mantem o conteudo anterior visivel e sinaliza a recarga', () => {
    consultas[0].next(resposta([folha('1', [['A', 'Alfa', 1]])]));
    component.carregar();
    fixture.detectChanges();
    expect(component.loading()).toBeTrue();
    expect(component.resposta()).not.toBeNull();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.recarga-barra')).not.toBeNull();
    expect(el.querySelector('.conteudo--recarregando')).not.toBeNull();
  });

  it('esconde o card de categorias sem dados e mostra o estado vazio', () => {
    consultas[0].next(resposta([]));
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-categoria-barras')).toBeNull();
    expect(el.textContent).toContain('Nenhuma folha encontrada');
  });

  it('mostra erro com tentar novamente e refaz a consulta', () => {
    consultas[0].error({ response: { data: { message: 'Falhou feio' } } });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(component.erro()).toBe('Falhou feio');
    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    component.carregar();
    expect(getKpiMotivos).toHaveBeenCalledTimes(2);
  });
});
