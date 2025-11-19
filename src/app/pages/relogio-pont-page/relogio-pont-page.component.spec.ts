import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelogioPontPageComponent } from './relogio-pont-page.component';

describe('RelogioPontPageComponent', () => {
  let component: RelogioPontPageComponent;
  let fixture: ComponentFixture<RelogioPontPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelogioPontPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelogioPontPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
