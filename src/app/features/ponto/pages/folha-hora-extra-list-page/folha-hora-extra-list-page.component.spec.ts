import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { FolhaHoraExtraAPIService } from '../../services/FolhaHoraExtraAPI.service';
import { FuncionariosAPIService } from '../../services/FuncionariosAPI.service';
import { FolhaHoraExtraListPageComponent } from './folha-hora-extra-list-page.component';

describe('FolhaHoraExtraListPageComponent (abas)', () => {
  let component: any;
  let cargos: string[];
  let getRefeicoes: jasmine.Spy;

  beforeEach(async () => {
    cargos = ['RH'];
    getRefeicoes = jasmine.createSpy('getRefeicoes').and.returnValue(of({ data: [], total: 0 }));
    await TestBed.configureTestingModule({
      imports: [FolhaHoraExtraListPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true), getCurrentNavigation: () => null } },
        { provide: UserstoreService, useValue: { item: () => ({ cargosLista: cargos }) } },
        { provide: FuncionariosAPIService, useValue: { getCentroDeCusto: () => of([]) } },
        { provide: FolhaHoraExtraAPIService, useValue: { getRefeicoes, getFolhas: () => of({ data: [], total: 0 }), getFolhaById: () => of({ funcionarios: [] }) } },
      ],
    }).compileComponents();
    component = TestBed.createComponent(FolhaHoraExtraListPageComponent).componentInstance;
  });

  it('libera a aba RH para RH e ADMIN, e nao para os demais cargos', () => {
    expect(component.canViewRhTab()).toBeTrue();
    cargos = ['DIRETOR'];
    expect(component.canViewRhTab()).toBeFalse();
  });

  it('nao consulta refeicoes na lista: a carga fica com a aba RH', () => {
    component.ngOnInit();
    expect(getRefeicoes).not.toHaveBeenCalled();
    expect(component.activeTab).toBe('rh');
  });
});
