import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PowerbiChartComponent } from './powerbi-chart.component';

describe('PowerbiChartComponent', () => {
  let component: PowerbiChartComponent;
  let fixture: ComponentFixture<PowerbiChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PowerbiChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PowerbiChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
