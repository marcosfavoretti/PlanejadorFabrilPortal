import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemPaginaComponent } from './item-pagina.component';

describe('ItemPaginaComponent', () => {
  let component: ItemPaginaComponent;
  let fixture: ComponentFixture<ItemPaginaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemPaginaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemPaginaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
