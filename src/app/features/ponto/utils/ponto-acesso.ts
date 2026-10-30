import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { LIDERES_ROLES } from '@/app/core/auth/role-groups';

/** Regras de acesso da lista de folhas de HE como funções puras sobre a lista de cargos do usuário. */
export type Cargos = readonly string[] | null | undefined;

const { ADMIN, COORDENADOR, DIRETOR, RH, SUPORTE } = SetUserCargoDTOCargoEnum;

function tem(cargos: Cargos, ...procurados: readonly string[]): boolean {
  return (cargos ?? []).some(cargo => procurados.includes(cargo));
}

export function isAdmin(cargos: Cargos): boolean {
  return tem(cargos, ADMIN);
}

/** Líder (ADMIN não conta: é tratado à parte nas regras). */
export function hasLeaderRole(cargos: Cargos): boolean {
  return tem(cargos, ...LIDERES_ROLES.filter(role => role !== ADMIN));
}

export function hasCoordinatorRole(cargos: Cargos): boolean {
  return tem(cargos, COORDENADOR);
}

export function hasCombinedLeaderCoordinatorRoles(cargos: Cargos): boolean {
  return hasLeaderRole(cargos) && hasCoordinatorRole(cargos);
}

export function canViewFolhas(cargos: Cargos): boolean {
  return isAdmin(cargos) || hasLeaderRole(cargos) || tem(cargos, SUPORTE, COORDENADOR, DIRETOR);
}

/** Aba RH (refeições). */
export function canViewRefeicoes(cargos: Cargos): boolean {
  return tem(cargos, ADMIN, RH);
}

/** Cadastro de categorias (backend: ADMIN e RH). */
export function canManageCategorias(cargos: Cargos): boolean {
  return tem(cargos, ADMIN, RH);
}

/** KPI de motivos (backend: RH, DIRETOR e ADMIN). */
export function canViewKpiMotivos(cargos: Cargos): boolean {
  return tem(cargos, ADMIN, RH, DIRETOR);
}

/** Aba KPI (gasto de folha por dia). */
export function canViewGastoFolhaPorDia(cargos: Cargos): boolean {
  return tem(cargos, ADMIN, RH, COORDENADOR, DIRETOR);
}

/** Relatório de recursos (backend: LIDER, SUPORTE, ADMIN, COORDENADOR, DIRETOR e RH). */
export function canViewRelatorioRecursos(cargos: Cargos): boolean {
  return tem(cargos, ADMIN, COORDENADOR, DIRETOR, RH, SUPORTE) || hasLeaderRole(cargos);
}

export function usesHistoricoDashboard(cargos: Cargos): boolean {
  return !hasCombinedLeaderCoordinatorRoles(cargos)
    && (hasCoordinatorRole(cargos) || tem(cargos, DIRETOR) || isAdmin(cargos));
}

export function canAuditHistorico(cargos: Cargos): boolean {
  return usesHistoricoDashboard(cargos) || hasLeaderRole(cargos);
}
