import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabricaPrincipalPageComponent } from './fabrica-principal-page.component';

describe('FabricaPrincipalPageComponent', () => {
  let component: FabricaPrincipalPageComponent;
  let fixture: ComponentFixture<FabricaPrincipalPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabricaPrincipalPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabricaPrincipalPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
