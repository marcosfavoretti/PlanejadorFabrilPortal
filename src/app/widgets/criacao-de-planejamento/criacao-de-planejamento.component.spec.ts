import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriacaoDePlanejamentoComponent } from './criacao-de-planejamento.component';

describe('CriacaoDePlanejamentoComponent', () => {
  let component: CriacaoDePlanejamentoComponent;
  let fixture: ComponentFixture<CriacaoDePlanejamentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CriacaoDePlanejamentoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CriacaoDePlanejamentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
