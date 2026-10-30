import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { FuncionariosAPIService } from '../../services/FuncionariosAPI.service';
import { FolhaHoraExtraAPIService } from '../../services/FolhaHoraExtraAPI.service';
import { FolhaHoraExtraFormPageComponent } from './folha-hora-extra-form-page.component';

// Exercise the real template: index tracking can leave inputs bound to removed rows.
describe('FolhaHoraExtraFormPageComponent employee removal', () => {
  let fixture: ComponentFixture<FolhaHoraExtraFormPageComponent>;
  let component: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolhaHoraExtraFormPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: UserstoreService, useValue: {} },
        { provide: FuncionariosAPIService, useValue: {} },
        { provide: FolhaHoraExtraAPIService, useValue: {} },
      ],
    }).compileComponents();
    spyOn(FolhaHoraExtraFormPageComponent.prototype, 'ngOnInit');
    fixture = TestBed.createComponent(FolhaHoraExtraFormPageComponent);
    component = fixture.componentInstance;
    for (const [matricula, nome] of [['001', 'Ana'], ['002', 'Bruno'], ['003', 'Carla']]) {
      component.addFuncionario();
      component.funcionarios.at(component.funcionarios.length - 1).patchValue({ matricula, nome });
    }
    fixture.detectChanges();
  });

  function rows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.employee-table-row'));
  }

  function remove(index: number): void {
    rows()[index].querySelector<HTMLButtonElement>('.employee-actions button')!.click();
    fixture.detectChanges();
  }

  function visibleMatriculas(): string[] {
    return rows().map(row => row.querySelector<HTMLInputElement>('.matricula-line input')!.value);
  }

  it('removes the first employee and preserves the remaining rendered rows and bindings', () => {
    const originalRows = rows();
    remove(0);
    expect(visibleMatriculas()).toEqual(['002', '003']);
    expect(rows()[0]).toBe(originalRows[1]);
    expect(rows()[1]).toBe(originalRows[2]);
    const input = rows()[0].querySelector<HTMLInputElement>('.matricula-line input')!;
    input.value = '004';
    input.dispatchEvent(new Event('input'));
    expect(component.funcionarios.at(0).get('matricula').value).toBe('004');
    expect(component.funcionarios.at(1).get('matricula').value).toBe('003');
  });

  it('removes the middle employee and allows adding and removing another employee', () => {
    const originalRows = rows();
    remove(1);
    expect(visibleMatriculas()).toEqual(['001', '003']);
    expect(rows()[1]).toBe(originalRows[2]);
    component.addFuncionario();
    component.funcionarios.at(2).patchValue({ matricula: '004', nome: 'Daniel' });
    fixture.detectChanges();
    remove(1);
    expect(visibleMatriculas()).toEqual(['001', '004']);
  });
});

describe('FolhaHoraExtraFormPageComponent categorias', () => {
  let fixture: ComponentFixture<FolhaHoraExtraFormPageComponent>;
  let component: any;
  const detalhe = { id: 'a'.repeat(24), codigo: 'OUTRO', nome: 'Pedido urgente', descricao: 'Pedido', exigeDetalhe: true, ativo: true, ordem: 1 };
  const simples = { id: 'b'.repeat(24), codigo: 'INVENTARIO', nome: 'Inventario', descricao: null, exigeDetalhe: false, ativo: true, ordem: 2 };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolhaHoraExtraFormPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: UserstoreService, useValue: {} },
        { provide: FuncionariosAPIService, useValue: {} },
        { provide: FolhaHoraExtraAPIService, useValue: {} },
      ],
    }).compileComponents();
    spyOn(FolhaHoraExtraFormPageComponent.prototype, 'ngOnInit');
    fixture = TestBed.createComponent(FolhaHoraExtraFormPageComponent);
    component = fixture.componentInstance;
    component.categorias = [detalhe, simples];
  });

  function linha(valores: Record<string, unknown> = {}) {
    component.addFuncionario();
    const row = component.funcionarios.at(component.funcionarios.length - 1);
    row.patchValue({ matricula: '001', nome: 'Ana', justificativa: 'motivo', ...valores });
    return row;
  }

  it('exige categoria em toda linha na criacao', () => {
    const row = linha();
    expect(row.hasError('categoriaObrigatoria')).toBeTrue();
    row.patchValue({ categoriaId: simples.id });
    expect(row.hasError('categoriaObrigatoria')).toBeFalse();
  });

  it('bloqueia justificativa com menos de 15 caracteres (trim) quando a categoria exige detalhe', () => {
    const row = linha({ categoriaId: detalhe.id, justificativa: '  curta demais   ' });
    expect(row.hasError('justificativaCurta')).toBeTrue();
    expect(component.tamanhoJustificativa(row)).toBe(12);
    row.patchValue({ justificativa: 'justificativa com mais de quinze' });
    expect(row.hasError('justificativaCurta')).toBeFalse();
  });

  it('na edicao nao exige categoria em linha antiga, mas exige em linha nova', () => {
    component.isEditMode = true;
    const antiga = linha({ matriculaOriginal: '001' });
    const nova = linha({ matricula: '002', matriculaOriginal: '' });
    expect(antiga.hasError('categoriaObrigatoria')).toBeFalse();
    expect(component.mostrarAvisoCategoria(antiga)).toBeTrue();
    expect(nova.hasError('categoriaObrigatoria')).toBeTrue();
  });

  it('na edicao reaplica exigeDetalhe a categoria mantida e so envia categoriaId quando alterada', () => {
    component.isEditMode = true;
    const row = linha({ matriculaOriginal: '001', categoriaId: detalhe.id, categoriaOriginalId: detalhe.id, justificativa: 'curta' });
    expect(row.hasError('justificativaCurta')).toBeTrue();
    row.patchValue({ justificativa: 'justificativa longa o bastante' });
    expect(component.buildPayload().funcionarios[0].categoriaId).toBeUndefined();
    row.patchValue({ categoriaId: simples.id });
    expect(component.buildPayload().funcionarios[0].categoriaId).toBe(simples.id);
  });
});
