import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualDateSimulationComponent } from './virtual-date-simulation.component';

describe('VirtualDateSimulationComponent', () => {
  let component: VirtualDateSimulationComponent;
  let fixture: ComponentFixture<VirtualDateSimulationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualDateSimulationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VirtualDateSimulationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
