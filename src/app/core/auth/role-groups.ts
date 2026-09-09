import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { CargoEnum } from '@/@core/enum/CARGO.enum';

export const LIDERES_ROLES = [
  SetUserCargoDTOCargoEnum.ADMIN,
  CargoEnum.LIDER,
];

export const ESTRUTURA_ROLES = [
  SetUserCargoDTOCargoEnum.ESTRUTURA,
  SetUserCargoDTOCargoEnum.ADMIN,
  SetUserCargoDTOCargoEnum.DIRETOR,
];
