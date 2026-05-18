import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabricaApresentacaoComponent } from './fabrica-apresentacao.component';

describe('FabricaApresentacaoComponent', () => {
  let component: FabricaApresentacaoComponent;
  let fixture: ComponentFixture<FabricaApresentacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabricaApresentacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabricaApresentacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
