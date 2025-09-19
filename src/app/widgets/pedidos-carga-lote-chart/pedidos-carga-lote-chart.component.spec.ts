import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidosCargaLoteChartComponent } from './pedidos-carga-lote-chart.component';

describe('PedidosCargaLoteChartComponent', () => {
  let component: PedidosCargaLoteChartComponent;
  let fixture: ComponentFixture<PedidosCargaLoteChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosCargaLoteChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidosCargaLoteChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
