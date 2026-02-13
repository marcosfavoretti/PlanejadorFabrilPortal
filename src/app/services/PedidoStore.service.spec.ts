import { TestBed } from '@angular/core/testing';
import { PedidoStoreService } from './PedidoStore.service';
import { PedidoService } from './Pedido.service';
import { GlobalFilterInputText } from '@/app/services/GlobalInputText.service';
import { signal } from '@angular/core';

fdescribe('PedidoStoreService', () => {
  let service: PedidoStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PedidoStoreService,
        {
          provide: PedidoService,
          useValue: {
            consultaPedido: () => {}
          }
        },
        {
          provide: GlobalFilterInputText,
          useValue: {
            getTextSignal: () => signal('')
          }
        }
      ]
    });
    service = TestBed.inject(PedidoStoreService);
  });

  it('should sort pedidoQuantidadeChart labels by date ascending', () => {
    // Use local dates to match format()'s default local behavior
    const date1 = new Date(2023, 0, 10); 
    const date2 = new Date(2023, 0, 5);
    const date3 = new Date(2023, 0, 20);

    const mockData: any[] = [
      { dataEntrega: date1, lote: 10 },
      { dataEntrega: date2, lote: 5 },
      { dataEntrega: date3, lote: 20 },
      { dataEntrega: date1, lote: 10 } // Duplicate date to check aggregation
    ];

    service.set(mockData);

    const chartData = service.pedidoQuantidadeChart();
    
    // Expected order: 05/01, 10/01, 20/01
    expect(chartData.labels).toEqual(['05/01/2023', '10/01/2023', '20/01/2023']);
    
    // Check amounts
    // 05/01: 1 item
    // 10/01: 2 items
    // 20/01: 1 item
    expect(chartData.datasets[0].data).toEqual([1, 2, 1]);
  });
});