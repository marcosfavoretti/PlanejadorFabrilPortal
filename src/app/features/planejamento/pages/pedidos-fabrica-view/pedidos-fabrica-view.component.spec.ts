import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidosFabricaViewComponent } from './pedidos-fabrica-view.component';

describe('PedidosFabricaViewComponent', () => {
  let component: PedidosFabricaViewComponent;
  let fixture: ComponentFixture<PedidosFabricaViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosFabricaViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidosFabricaViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
