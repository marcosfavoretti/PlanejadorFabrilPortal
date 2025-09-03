import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidosTabelaComponent } from './pedidos-tabela.component';

describe('PedidosTabelaComponent', () => {
  let component: PedidosTabelaComponent;
  let fixture: ComponentFixture<PedidosTabelaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosTabelaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidosTabelaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
