import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProfileAvatarComponent } from './user-profile-avatar.component';

describe('UserProfileAvatarComponent', () => {
  let component: UserProfileAvatarComponent;
  let fixture: ComponentFixture<UserProfileAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserProfileAvatarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserProfileAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
