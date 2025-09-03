import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanejamentoFiltroDeDataComponent } from './planejamento-filtro-de-data.component';

describe('PlanejamentoFiltroDeDataComponent', () => {
  let component: PlanejamentoFiltroDeDataComponent;
  let fixture: ComponentFixture<PlanejamentoFiltroDeDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanejamentoFiltroDeDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanejamentoFiltroDeDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
