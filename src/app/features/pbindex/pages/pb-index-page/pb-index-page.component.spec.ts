import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PbIndexPageComponent } from './pb-index-page.component';

describe('PbIndexPageComponent', () => {
  let component: PbIndexPageComponent;
  let fixture: ComponentFixture<PbIndexPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PbIndexPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PbIndexPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
