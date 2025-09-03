import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinhasFabricasPopUpComponent } from './minhas-fabricas-pop-up.component';

describe('MinhasFabricasPopUpComponent', () => {
  let component: MinhasFabricasPopUpComponent;
  let fixture: ComponentFixture<MinhasFabricasPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinhasFabricasPopUpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinhasFabricasPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
