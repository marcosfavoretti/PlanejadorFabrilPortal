import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificadoCaterpillarPageComponent } from './certificado-caterpillar-page.component';

describe('CertificadoCaterpillarPageComponent', () => {
  let component: CertificadoCaterpillarPageComponent;
  let fixture: ComponentFixture<CertificadoCaterpillarPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificadoCaterpillarPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificadoCaterpillarPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
