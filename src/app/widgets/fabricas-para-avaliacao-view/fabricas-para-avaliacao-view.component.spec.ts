import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabricasParaAvaliacaoViewComponent } from './fabricas-para-avaliacao-view.component';

describe('FabricasParaAvaliacaoViewComponent', () => {
  let component: FabricasParaAvaliacaoViewComponent;
  let fixture: ComponentFixture<FabricasParaAvaliacaoViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabricasParaAvaliacaoViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabricasParaAvaliacaoViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
