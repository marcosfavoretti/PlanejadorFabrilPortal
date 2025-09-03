import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EdicaoDePlanejamentoPopUpComponent } from './edicao-de-planejamento-pop-up.component';

describe('EdicaoDePlanejamentoPopUpComponent', () => {
  let component: EdicaoDePlanejamentoPopUpComponent;
  let fixture: ComponentFixture<EdicaoDePlanejamentoPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdicaoDePlanejamentoPopUpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EdicaoDePlanejamentoPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
