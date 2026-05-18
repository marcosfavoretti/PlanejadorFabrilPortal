import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupNameRequiredPbIndexComponent } from './popup-name-required-pb-index.component';

describe('PopupNameRequiredPbIndexComponent', () => {
  let component: PopupNameRequiredPbIndexComponent;
  let fixture: ComponentFixture<PopupNameRequiredPbIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupNameRequiredPbIndexComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupNameRequiredPbIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
