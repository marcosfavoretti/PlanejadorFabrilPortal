import {
  categoriaLabel,
  justificativaAtendeCategoria,
  linhasCitadasNoErro,
  somarTotaisPorCategoria,
  sugerirOrdemCategoria,
} from './categoria-he';

describe('categoria-he utils', () => {
  it('rotula categoria nula como "Sem categoria"', () => {
    expect(categoriaLabel(null)).toBe('Sem categoria');
    expect(categoriaLabel({ nome: 'Pedido urgente' })).toBe('Pedido urgente');
  });

  it('exige 15 caracteres (trim) quando a categoria exige detalhe', () => {
    expect(justificativaAtendeCategoria('   curta     ', true)).toBeFalse();
    expect(justificativaAtendeCategoria('a'.repeat(14) + '   ', true)).toBeFalse();
    expect(justificativaAtendeCategoria(' ' + 'a'.repeat(15) + ' ', true)).toBeTrue();
  });

  it('exige apenas justificativa preenchida sem exigeDetalhe', () => {
    expect(justificativaAtendeCategoria('  ', false)).toBeFalse();
    expect(justificativaAtendeCategoria('ok', false)).toBeTrue();
  });

  it('sugere a maior ordem abaixo de 99 mais um', () => {
    expect(sugerirOrdemCategoria([])).toBe(1);
    expect(sugerirOrdemCategoria([{ ordem: 3 }, { ordem: 13 }, { ordem: 99 }])).toBe(14);
  });

  it('soma totais por codigo e ordena por quantidade e nome', () => {
    const resultado = somarTotaisPorCategoria([
      [{ codigo: 'A', nome: 'Alfa', quantidadeFuncionarios: 1 }, { codigo: null, nome: 'Sem', quantidadeFuncionarios: 2 }],
      [{ codigo: 'A', nome: 'Alfa', quantidadeFuncionarios: 2 }, { codigo: 'B', nome: 'Beta', quantidadeFuncionarios: 3 }],
      undefined,
    ]);
    expect(resultado.map(item => [item.codigo, item.quantidadeFuncionarios])).toEqual([['A', 3], ['B', 3], [null, 2]]);
  });

  it('identifica linhas citadas na mensagem de erro', () => {
    const mensagens = [
      'Informe a categoria da hora extra do funcionário 222 - Bruno.',
      'funcionarios.0.categoriaId must be a mongodb id',
    ];
    expect([...linhasCitadasNoErro(mensagens, ['111', '222', '333'])].sort()).toEqual([0, 1]);
  });
});
