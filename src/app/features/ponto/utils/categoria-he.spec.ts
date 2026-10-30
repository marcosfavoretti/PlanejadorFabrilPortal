import {
  categoriaIdParaEnvio,
  categoriaLabel,
  justificativaAtendeCategoria,
  linhasCitadasNoErro,
  somarTotaisPorCategoria,
  sugerirOrdemCategoria,
  validarLinhaCategoria,
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

describe('regras de linha de categoria', () => {
  const base = { modoEdicao: false, linhaNova: true, categoriaId: null, categoriaOriginalId: null, exigeDetalhe: false, justificativa: 'ok' };

  it('criacao exige categoria', () => {
    expect(validarLinhaCategoria(base)).toEqual({ categoriaObrigatoria: true });
  });

  it('edicao de linha antiga sem categoria nao bloqueia', () => {
    expect(validarLinhaCategoria({ ...base, modoEdicao: true, linhaNova: false })).toBeNull();
  });

  it('categoria nula fica isenta de exigeDetalhe', () => {
    expect(validarLinhaCategoria({ ...base, modoEdicao: true, linhaNova: false, exigeDetalhe: true })).toBeNull();
  });

  it('categoria mantida na edicao aplica exigeDetalhe', () => {
    const erro = validarLinhaCategoria({ ...base, modoEdicao: true, linhaNova: false, categoriaOriginalId: 'x', exigeDetalhe: true });
    expect(erro).toEqual({ justificativaCurta: true });
  });

  it('envia categoriaId na criacao, em linhas novas e quando alterada', () => {
    expect(categoriaIdParaEnvio({ ...base, categoriaId: 'x' })).toBe('x');
    expect(categoriaIdParaEnvio({ modoEdicao: true, linhaNova: true, categoriaId: 'x', categoriaOriginalId: null })).toBe('x');
    expect(categoriaIdParaEnvio({ modoEdicao: true, linhaNova: false, categoriaId: 'x', categoriaOriginalId: 'x' })).toBeUndefined();
    expect(categoriaIdParaEnvio({ modoEdicao: true, linhaNova: false, categoriaId: 'y', categoriaOriginalId: 'x' })).toBe('y');
  });
});
