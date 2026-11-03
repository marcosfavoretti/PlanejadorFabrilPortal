import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { podeSubmeterFolha } from './ponto-roles';

describe('podeSubmeterFolha', () => {
  const { SUPORTE, LIDER, ADMIN, COORDENADOR, DIRETOR, RH } = SetUserCargoDTOCargoEnum;

  it('permite submeter quando o usuario tem SUPORTE e LIDER', () => {
    expect(podeSubmeterFolha([SUPORTE, LIDER])).toBeTrue();
    expect(podeSubmeterFolha([LIDER, SUPORTE])).toBeTrue();
  });

  it('permite submeter com qualquer cargo operacional sem SUPORTE', () => {
    for (const cargo of [LIDER, ADMIN, COORDENADOR, DIRETOR, RH]) {
      expect(podeSubmeterFolha([cargo])).toBeTrue();
    }
  });

  it('bloqueia quem tem apenas SUPORTE', () => {
    expect(podeSubmeterFolha([SUPORTE])).toBeFalse();
  });

  it('bloqueia cargos fora do modulo e usuarios sem cargos', () => {
    expect(podeSubmeterFolha([SetUserCargoDTOCargoEnum.ESTRUTURA])).toBeFalse();
    expect(podeSubmeterFolha([])).toBeFalse();
    expect(podeSubmeterFolha(undefined)).toBeFalse();
  });
});
