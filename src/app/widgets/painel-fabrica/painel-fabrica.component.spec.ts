import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelFabricaComponent } from './painel-fabrica.component';

describe('PainelFabricaComponent', () => {
  let component: PainelFabricaComponent;
  let fixture: ComponentFixture<PainelFabricaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelFabricaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PainelFabricaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
