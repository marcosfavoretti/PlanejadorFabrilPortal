import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProduzidosEntreSetoresComponent } from './produzidos-entre-setores.component';

describe('ProduzidosEntreSetoresComponent', () => {
  let component: ProduzidosEntreSetoresComponent;
  let fixture: ComponentFixture<ProduzidosEntreSetoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProduzidosEntreSetoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProduzidosEntreSetoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
