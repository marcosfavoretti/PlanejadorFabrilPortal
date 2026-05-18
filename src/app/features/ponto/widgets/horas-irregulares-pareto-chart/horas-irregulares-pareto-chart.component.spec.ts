import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorasIrregularesParetoChartComponent } from './horas-irregulares-pareto-chart.component';

describe('HorasIrregularesParetoChartComponent', () => {
  let component: HorasIrregularesParetoChartComponent;
  let fixture: ComponentFixture<HorasIrregularesParetoChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorasIrregularesParetoChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HorasIrregularesParetoChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
