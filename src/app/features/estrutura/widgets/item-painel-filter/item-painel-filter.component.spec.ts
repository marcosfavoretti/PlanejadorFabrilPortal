/* tslint:disable:no-unused-variable */
import { waitForAsync as async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ItemPainelFilterComponent } from './item-painel-filter.component';

describe('ItemPainelFilterComponent', () => {
  let component: ItemPainelFilterComponent;
  let fixture: ComponentFixture<ItemPainelFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemPainelFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemPainelFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
