import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContextoSimulacaoComponent } from './contexto-simulacao.component';

describe('ContextoSimulacaoComponent', () => {
  let component: ContextoSimulacaoComponent;
  let fixture: ComponentFixture<ContextoSimulacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContextoSimulacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContextoSimulacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
