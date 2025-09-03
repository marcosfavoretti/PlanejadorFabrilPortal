import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabelaPlanejamentoComponent } from './tabela-planejamento.component';

describe('TabelaPlanejamentoComponent', () => {
  let component: TabelaPlanejamentoComponent;
  let fixture: ComponentFixture<TabelaPlanejamentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabelaPlanejamentoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabelaPlanejamentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
