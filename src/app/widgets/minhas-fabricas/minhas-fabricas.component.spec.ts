import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinhasFabricasComponent } from './minhas-fabricas.component';

describe('MinhasFabricasComponent', () => {
  let component: MinhasFabricasComponent;
  let fixture: ComponentFixture<MinhasFabricasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinhasFabricasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinhasFabricasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
