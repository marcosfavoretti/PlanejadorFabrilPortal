import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContadorAtrasoComponent } from './contador-atraso.component';

describe('ContadorAtrasoComponent', () => {
  let component: ContadorAtrasoComponent;
  let fixture: ComponentFixture<ContadorAtrasoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContadorAtrasoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContadorAtrasoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
