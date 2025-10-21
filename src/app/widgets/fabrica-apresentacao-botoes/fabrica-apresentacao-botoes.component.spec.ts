import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabricaApresentacaoBotoesComponent } from './fabrica-apresentacao-botoes.component';

describe('FabricaApresentacaoBotoesComponent', () => {
  let component: FabricaApresentacaoBotoesComponent;
  let fixture: ComponentFixture<FabricaApresentacaoBotoesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabricaApresentacaoBotoesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabricaApresentacaoBotoesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
