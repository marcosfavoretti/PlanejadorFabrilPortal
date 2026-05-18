import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupRefreshDonePbIndexComponent } from './popup-refresh-done-pb-index.component';

describe('PopupRefreshDonePbIndexComponent', () => {
  let component: PopupRefreshDonePbIndexComponent;
  let fixture: ComponentFixture<PopupRefreshDonePbIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupRefreshDonePbIndexComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupRefreshDonePbIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
