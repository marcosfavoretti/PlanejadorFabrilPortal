import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { LIDERES_ROLES } from '@/app/core/auth/role-groups';

export const PONTO_ROLES = [
  SetUserCargoDTOCargoEnum.ADMIN,
  SetUserCargoDTOCargoEnum.COORDENADOR,
  SetUserCargoDTOCargoEnum.DIRETOR,
  SetUserCargoDTOCargoEnum.SUPORTE,
  SetUserCargoDTOCargoEnum.RH,
  ...LIDERES_ROLES,
];

/**
 * SUPORTE apenas apoia a folha (cria/edita), mas não a submete para aprovação.
 * A permissão é concedida se QUALQUER cargo do usuário, diferente de SUPORTE,
 * pertencer ao módulo de ponto (ex.: SUPORTE + LIDER pode submeter).
 */
export function podeSubmeterFolha(cargos: readonly string[] | null | undefined): boolean {
  return (cargos ?? []).some(
    cargo => cargo !== SetUserCargoDTOCargoEnum.SUPORTE && (PONTO_ROLES as readonly string[]).includes(cargo),
  );
}
