import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePageNavigatorComponent } from './home-page-navigator.component';

describe('HomePageNavigatorComponent', () => {
  let component: HomePageNavigatorComponent;
  let fixture: ComponentFixture<HomePageNavigatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageNavigatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomePageNavigatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
