import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabricaPageReadOnlyComponent } from './fabrica-page-read-only.component';

describe('FabricaPageReadOnlyComponent', () => {
  let component: FabricaPageReadOnlyComponent;
  let fixture: ComponentFixture<FabricaPageReadOnlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabricaPageReadOnlyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabricaPageReadOnlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
