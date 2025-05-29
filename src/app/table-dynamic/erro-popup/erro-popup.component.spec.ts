import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErroPopupComponent } from './erro-popup.component';

describe('ErroPopupComponent', () => {
  let component: ErroPopupComponent;
  let fixture: ComponentFixture<ErroPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErroPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErroPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
