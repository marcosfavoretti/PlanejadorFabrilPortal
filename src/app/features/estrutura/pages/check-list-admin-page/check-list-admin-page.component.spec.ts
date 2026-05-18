/* tslint:disable:no-unused-variable */
import { waitForAsync as async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CheckListAdminPageComponent } from './check-list-admin-page.component';

describe('CheckListAdminPageComponent', () => {
  let component: CheckListAdminPageComponent;
  let fixture: ComponentFixture<CheckListAdminPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CheckListAdminPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckListAdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
