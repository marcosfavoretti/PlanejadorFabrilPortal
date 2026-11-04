import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetoresTablesComponent } from './setores-tables.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('SetoresTablesComponent', () => {
  let component: SetoresTablesComponent;
  let fixture: ComponentFixture<SetoresTablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetoresTablesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetoresTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
