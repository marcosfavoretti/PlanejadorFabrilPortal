import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import {
  canAuditHistorico,
  canManageCategorias,
  canViewFolhas,
  canViewGastoFolhaPorDia,
  canViewKpiMotivos,
  canViewRefeicoes,
  canViewRelatorioRecursos,
  usesHistoricoDashboard,
} from './ponto-acesso';

describe('ponto-acesso', () => {
  const { ADMIN, COORDENADOR, DIRETOR, RH, SUPORTE, LIDER, ESTRUTURA } = SetUserCargoDTOCargoEnum;

  it('ADMIN pode tudo', () => {
    for (const regra of [canViewFolhas, canViewRefeicoes, canManageCategorias, canViewKpiMotivos,
      canViewGastoFolhaPorDia, canViewRelatorioRecursos, canAuditHistorico]) {
      expect(regra([ADMIN])).toBeTrue();
    }
  });

  it('categorias: so ADMIN e RH; motivos: tambem DIRETOR', () => {
    expect(canManageCategorias([RH])).toBeTrue();
    expect(canManageCategorias([DIRETOR])).toBeFalse();
    expect(canViewKpiMotivos([DIRETOR])).toBeTrue();
    expect(canViewKpiMotivos([COORDENADOR])).toBeFalse();
  });

  it('relatorio de recursos acompanha o backend, incluindo quem ve a aba KPI', () => {
    for (const cargo of [COORDENADOR, DIRETOR, RH, SUPORTE, LIDER]) {
      expect(canViewRelatorioRecursos([cargo])).toBeTrue();
    }
    expect(canViewRelatorioRecursos([ESTRUTURA])).toBeFalse();
    expect(canViewRelatorioRecursos([])).toBeFalse();
    // Todo cargo que ve a aba KPI tambem pode chamar o endpoint.
    for (const cargo of [ADMIN, RH, COORDENADOR, DIRETOR]) {
      expect(canViewGastoFolhaPorDia([cargo])).toBeTrue();
      expect(canViewRelatorioRecursos([cargo])).toBeTrue();
    }
  });

  it('aba RH so para ADMIN e RH', () => {
    expect(canViewRefeicoes([RH])).toBeTrue();
    expect(canViewRefeicoes([COORDENADOR, LIDER])).toBeFalse();
    expect(canViewRefeicoes(undefined)).toBeFalse();
  });

  it('LIDER + COORDENADOR nao usa o dashboard historico, mas audita como lider', () => {
    expect(usesHistoricoDashboard([LIDER, COORDENADOR])).toBeFalse();
    expect(canAuditHistorico([LIDER, COORDENADOR])).toBeTrue();
    expect(canAuditHistorico([SUPORTE])).toBeFalse();
    expect(canViewFolhas([SUPORTE])).toBeTrue();
  });
});
