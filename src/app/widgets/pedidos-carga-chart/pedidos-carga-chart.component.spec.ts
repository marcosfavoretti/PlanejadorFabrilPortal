import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidosCargaChartComponent } from './pedidos-carga-chart.component';

describe('PedidosCargaChartComponent', () => {
  let component: PedidosCargaChartComponent;
  let fixture: ComponentFixture<PedidosCargaChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosCargaChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidosCargaChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
