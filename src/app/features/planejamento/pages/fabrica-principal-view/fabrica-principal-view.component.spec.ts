import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabricaPrincipalViewComponent } from './fabrica-principal-view.component';

describe('FabricaPrincipalViewComponent', () => {
  let component: FabricaPrincipalViewComponent;
  let fixture: ComponentFixture<FabricaPrincipalViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabricaPrincipalViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabricaPrincipalViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
