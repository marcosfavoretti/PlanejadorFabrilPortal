import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContagemBufferPageComponent } from './contagem-buffer-page.component';
import { MessageService } from 'primeng/api';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ContagemBufferPageComponent', () => {
  let component: ContagemBufferPageComponent;
  let fixture: ComponentFixture<ContagemBufferPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContagemBufferPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, provideRouter([])]
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
