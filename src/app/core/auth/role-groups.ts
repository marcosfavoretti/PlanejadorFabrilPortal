import { SetUserCargoDTOCargoEnum } from '@/api/auth';

export const LIDERES_ROLES = [
  SetUserCargoDTOCargoEnum.ADMIN,
  SetUserCargoDTOCargoEnum.LIDER_MONTAGEM,
  SetUserCargoDTOCargoEnum.LIDER_MONTAGEM,
  SetUserCargoDTOCargoEnum.LIDER_QUALIDADE,
  SetUserCargoDTOCargoEnum.LIDER_PROCESSOS,
  SetUserCargoDTOCargoEnum.LIDER_SOLDA,
  SetUserCargoDTOCargoEnum.LIDER_LASER,
];

export const ESTRUTURA_ROLES = [
  SetUserCargoDTOCargoEnum.ESTRUTURA,
  SetUserCargoDTOCargoEnum.ADMIN,
  SetUserCargoDTOCargoEnum.DIRETOR,
];
