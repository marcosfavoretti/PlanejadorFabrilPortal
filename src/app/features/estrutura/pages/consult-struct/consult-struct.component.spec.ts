import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultStructComponent } from './consult-struct.component';

describe('ConsultStructComponent', () => {
  let component: ConsultStructComponent;
  let fixture: ComponentFixture<ConsultStructComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultStructComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConsultStructComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
