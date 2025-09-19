import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContadorDividaComponent } from './contador-divida.component';

describe('ContadorDividaComponent', () => {
  let component: ContadorDividaComponent;
  let fixture: ComponentFixture<ContadorDividaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContadorDividaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContadorDividaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
