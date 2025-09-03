import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabricaPageComponent } from './fabrica-page.component';

describe('FabricaPageComponent', () => {
  let component: FabricaPageComponent;
  let fixture: ComponentFixture<FabricaPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabricaPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabricaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
