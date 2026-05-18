import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContagemBufferPageComponent } from './contagem-buffer-page.component';

describe('ContagemBufferPageComponent', () => {
  let component: ContagemBufferPageComponent;
  let fixture: ComponentFixture<ContagemBufferPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContagemBufferPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContagemBufferPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
