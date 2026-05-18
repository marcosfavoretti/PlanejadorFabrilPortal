import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabelaFabricaParaAvaliacaoComponent } from './tabela-fabrica-para-avaliacao.component';

describe('TabelaFabricaParaAvaliacaoComponent', () => {
  let component: TabelaFabricaParaAvaliacaoComponent;
  let fixture: ComponentFixture<TabelaFabricaParaAvaliacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabelaFabricaParaAvaliacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabelaFabricaParaAvaliacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
