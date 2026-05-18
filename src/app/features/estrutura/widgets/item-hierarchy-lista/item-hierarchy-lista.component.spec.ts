/* tslint:disable:no-unused-variable */
import { waitForAsync as async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ItemHierarchyListaComponent } from './item-hierarchy-lista.component';

describe('ItemHierarchyListaComponent', () => {
  let component: ItemHierarchyListaComponent;
  let fixture: ComponentFixture<ItemHierarchyListaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemHierarchyListaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemHierarchyListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
