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
