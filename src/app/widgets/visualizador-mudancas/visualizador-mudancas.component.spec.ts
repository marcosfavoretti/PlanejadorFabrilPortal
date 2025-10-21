import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizadorMudancasComponent } from './visualizador-mudancas.component';

describe('VisualizadorMudancasComponent', () => {
  let component: VisualizadorMudancasComponent;
  let fixture: ComponentFixture<VisualizadorMudancasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizadorMudancasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisualizadorMudancasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
