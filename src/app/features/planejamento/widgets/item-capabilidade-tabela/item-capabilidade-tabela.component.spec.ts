import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemCapabilidadeTabelaComponent } from './item-capabilidade-tabela.component';

describe('ItemCapabilidadeTabelaComponent', () => {
  let component: ItemCapabilidadeTabelaComponent;
  let fixture: ComponentFixture<ItemCapabilidadeTabelaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemCapabilidadeTabelaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemCapabilidadeTabelaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
