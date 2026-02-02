import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetoresDirComponent } from './setores-dir.component';

describe('SetoresDirComponent', () => {
  let component: SetoresDirComponent;
  let fixture: ComponentFixture<SetoresDirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetoresDirComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetoresDirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
