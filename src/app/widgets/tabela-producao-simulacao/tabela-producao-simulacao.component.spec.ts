import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabelaProducaoSimulacaoComponent } from './tabela-producao-simulacao.component';

describe('TabelaProducaoSimulacaoComponent', () => {
  let component: TabelaProducaoSimulacaoComponent;
  let fixture: ComponentFixture<TabelaProducaoSimulacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabelaProducaoSimulacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabelaProducaoSimulacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
