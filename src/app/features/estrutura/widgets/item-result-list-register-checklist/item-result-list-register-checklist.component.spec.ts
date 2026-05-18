/* tslint:disable:no-unused-variable */
import { waitForAsync as async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ItemResultListRegisterChecklistComponent } from './item-result-list-register-checklist.component';

describe('ItemResultListRegisterChecklistComponent', () => {
  let component: ItemResultListRegisterChecklistComponent;
  let fixture: ComponentFixture<ItemResultListRegisterChecklistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemResultListRegisterChecklistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemResultListRegisterChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
