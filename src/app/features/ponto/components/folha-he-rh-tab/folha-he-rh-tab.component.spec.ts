import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject, of } from 'rxjs';
import { CategoriaHoraExtraAPIService } from '../../services/CategoriaHoraExtraAPI.service';
import { FolhaHoraExtraAPIService } from '../../services/FolhaHoraExtraAPI.service';
import { FolhaHeRhTabComponent } from './folha-he-rh-tab.component';

describe('FolhaHeRhTabComponent refeicoes x categoria (servidor)', () => {
  let component: any;
  let fixture: ComponentFixture<FolhaHeRhTabComponent>;
  let getRefeicoes: jasmine.Spy;

  beforeEach(async () => {
    getRefeicoes = jasmine.createSpy('getRefeicoes').and.callFake((filtros: { page: number; limit: number; categoriaCodigo?: string }) => of({
      // O servidor filtra: 30 linhas com categoria, 7 sem; total acompanha o filtro.
      total: filtros.categoriaCodigo === 'SEM_CATEGORIA' ? 7 : filtros.categoriaCodigo ? 30 : 37,
      page: filtros.page, limit: filtros.limit, totalPages: 1,
      data: [{ folhaId: 'f', matricula: String(filtros.page), nome: 'N', categoria: null }],
    }));
    await TestBed.configureTestingModule({
      imports: [FolhaHeRhTabComponent],
      providers: [
        provideNoopAnimations(),
        { provide: CategoriaHoraExtraAPIService, useValue: { getTodas: () => of([]), catalogoAlterado$: new Subject<void>() } },
        { provide: FolhaHoraExtraAPIService, useValue: { getRefeicoes, getFolhas: () => of({ data: [], total: 0 }), getFolhaById: () => of({ funcionarios: [] }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FolhaHeRhTabComponent);
    fixture.componentRef.setInput('canViewRefeicoes', true);
    fixture.componentRef.setInput('canManageCategorias', true);
    component = fixture.componentInstance;
    // O primeiro detectChanges executa o ngOnInit (carga inicial da aba).
    fixture.detectChanges();
    component.onRefeicoesLazyLoad({ first: 0, rows: 50 });
  });

  const ultimaChamada = () => getRefeicoes.calls.mostRecent().args[0];

  it('sem categoria nao envia categoriaCodigo e usa o total do servidor', () => {
    expect(ultimaChamada().categoriaCodigo).toBeUndefined();
    expect(component.refeicoesTotalRecords).toBe(37);
  });

  it('envia o codigo da categoria e usa linhas e total do servidor', () => {
    component.refeicoesCategoriaFilter.setValue('PEDIDO');
    expect(ultimaChamada().categoriaCodigo).toBe('PEDIDO');
    expect(component.refeicoesTotalRecords).toBe(30);
  });

  it('envia SEM_CATEGORIA para folhas antigas', () => {
    component.refeicoesCategoriaFilter.setValue('SEM_CATEGORIA');
    expect(ultimaChamada().categoriaCodigo).toBe('SEM_CATEGORIA');
    expect(component.refeicoesTotalRecords).toBe(7);
  });

  it('volta para a primeira pagina ao mudar o filtro e pagina no servidor', () => {
    component.onRefeicoesLazyLoad({ first: 100, rows: 50 });
    expect(ultimaChamada().page).toBe(2);
    component.refeicoesCategoriaFilter.setValue('PEDIDO');
    expect(component.refeicoesFirst).toBe(0);
    expect(ultimaChamada().page).toBe(0);
    expect(ultimaChamada().limit).toBe(50);
  });

  it('renderiza refeicoes e categorias quando o usuario tem acesso', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('section[aria-label="Refeições e equipe"]')).not.toBeNull();
    expect(el.querySelector('#rh-categorias app-categorias-hora-extra-section')).not.toBeNull();
  });

  it('nao renderiza nenhuma secao sem permissao', () => {
    const chamadasAntes = getRefeicoes.calls.count();
    const semAcesso = TestBed.createComponent(FolhaHeRhTabComponent);
    semAcesso.componentRef.setInput('canViewRefeicoes', false);
    semAcesso.componentRef.setInput('canManageCategorias', false);
    semAcesso.detectChanges();
    expect(semAcesso.nativeElement.querySelector('section')).toBeNull();
    expect(getRefeicoes.calls.count()).toBe(chamadasAntes);
  });
});
