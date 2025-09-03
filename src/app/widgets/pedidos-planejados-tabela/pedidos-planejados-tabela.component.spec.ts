import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidosPlanejadosTabelaComponent } from './pedidos-planejados-tabela.component';

describe('PedidosPlanejadosTabelaComponent', () => {
  let component: PedidosPlanejadosTabelaComponent;
  let fixture: ComponentFixture<PedidosPlanejadosTabelaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosPlanejadosTabelaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidosPlanejadosTabelaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
