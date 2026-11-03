import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService } from 'primeng/api';
import { Subject, of } from 'rxjs';
import { CategoriaHoraExtraAPIService } from '../../services/CategoriaHoraExtraAPI.service';
import { CategoriasHoraExtraSectionComponent } from './categorias-hora-extra-section.component';

describe('CategoriasHoraExtraSectionComponent', () => {
  const ativa = { id: 'a1', codigo: 'PEDIDO', nome: 'Pedido', descricao: 'Texto', exigeDetalhe: false, ativo: true, ordem: 3 };
  const inativa = { id: 'a2', codigo: 'VELHA', nome: 'Velha', descricao: null, exigeDetalhe: false, ativo: false, ordem: 120 };

  let component: any;
  let service: { getTodas: jasmine.Spy; criar: jasmine.Spy; atualizar: jasmine.Spy };
  let confirmation: { confirm: jasmine.Spy };  // fake de ConfirmationService

  beforeEach(async () => {
    service = {
      getTodas: jasmine.createSpy('getTodas').and.returnValue(of([ativa, inativa])),
      criar: jasmine.createSpy('criar').and.returnValue(of(ativa)),
      atualizar: jasmine.createSpy('atualizar').and.returnValue(of(ativa)),
    };
    confirmation = { confirm: jasmine.createSpy('confirm'), requireConfirmation$: new Subject(), onAccept: new Subject() } as never;
    await TestBed.configureTestingModule({
      imports: [CategoriasHoraExtraSectionComponent],
      providers: [provideNoopAnimations(), { provide: CategoriaHoraExtraAPIService, useValue: service }],
    })
      .overrideComponent(CategoriasHoraExtraSectionComponent, {
        set: { providers: [{ provide: ConfirmationService, useValue: confirmation }] },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(CategoriasHoraExtraSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sugere a proxima ordem ignorando ordens reservadas e permite informar o codigo so na criacao', () => {
    component.abrirCriacao();
    expect(component.form.controls.ordem.value).toBe(4);
    expect(component.form.controls.codigo.enabled).toBeTrue();

    component.abrirEdicao(ativa);
    expect(component.form.controls.codigo.disabled).toBeTrue();
    expect(component.form.controls.codigo.value).toBe('PEDIDO');
  });

  it('na criacao omite a descricao vazia', () => {
    component.abrirCriacao();
    component.form.patchValue({ codigo: 'NOVA_CAT', nome: ' Nova ', descricao: '   ' });
    component.salvar();
    expect(service.criar).toHaveBeenCalledWith({
      codigo: 'NOVA_CAT', nome: 'Nova', descricao: undefined, exigeDetalhe: false, ordem: 4,
    });
  });

  it('no PATCH envia descricao vazia para limpar (o backend aceita string vazia) e nao envia o codigo', () => {
    component.abrirEdicao(ativa);
    component.form.patchValue({ descricao: '' });
    component.salvar();
    expect(service.atualizar).toHaveBeenCalledWith('a1', { nome: 'Pedido', descricao: '', exigeDetalhe: false, ordem: 3 });
  });

  it('ativar uma categoria inativa envia ativo=true e ignora cliques duplicados durante o pedido', () => {
    const pendente = new Subject<typeof ativa>();
    service.atualizar.and.returnValue(pendente);

    component.alternarAtivo(inativa);
    component.alternarAtivo(inativa);
    expect(service.atualizar).toHaveBeenCalledTimes(1);
    expect(service.atualizar).toHaveBeenCalledWith('a2', { ativo: true });
    expect(component.alternando()).toBe('a2');

    pendente.next(ativa);
    pendente.complete();
    expect(component.alternando()).toBeNull();
  });

  it('desativar pede confirmacao e so chama a API ao aceitar', () => {
    component.alternarAtivo(ativa);
    expect(service.atualizar).not.toHaveBeenCalled();
    expect(confirmation.confirm).toHaveBeenCalledTimes(1);

    confirmation.confirm.calls.mostRecent().args[0].accept();
    expect(service.atualizar).toHaveBeenCalledWith('a1', { ativo: false });
  });
});
