/* tslint:disable:no-unused-variable */
import { waitForAsync as async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ItemPainelFilterPopupComponent } from './item-painel-filter-popup.component';

describe('ItemPainelFilterPopupComponent', () => {
  let component: ItemPainelFilterPopupComponent;
  let fixture: ComponentFixture<ItemPainelFilterPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemPainelFilterPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemPainelFilterPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
