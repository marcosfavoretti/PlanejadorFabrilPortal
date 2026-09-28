import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobilePhotoAuditComponent } from './mobile-photo-audit.component';

describe('MobilePhotoAuditComponent', () => {
  let component: MobilePhotoAuditComponent;
  let fixture: ComponentFixture<MobilePhotoAuditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobilePhotoAuditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobilePhotoAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
