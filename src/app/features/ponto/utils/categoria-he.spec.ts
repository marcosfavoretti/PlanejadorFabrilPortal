import {
  categoriaIdParaEnvio,
  categoriaLabel,
  filtrarPorCategoria,
  justificativaAtendeCategoria,
  linhasCitadasNoErro,
  montarDadosGraficoCategorias,
  opcoesFiltroCategoria,
  paginarLocal,
  podeLimparCategoria,
  resolverCategoria,
  SEM_CATEGORIA_COR,
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

  it('nao confunde matriculas por sufixo e escapa caracteres especiais', () => {
    const mensagem = 'Funcionario 0123 - Fulano esta fora do centro de custo.';
    expect([...linhasCitadasNoErro([mensagem], ['123', '0123'])]).toEqual([1]);
    expect([...linhasCitadasNoErro(['(funcionario 123 - Ana)'], ['123'])]).toEqual([0]);
    expect([...linhasCitadasNoErro(['x 1.3 - Ana'], ['1.3', '1a3'])]).toEqual([0]);
  });

  it('filtra por categoria (SEM_CATEGORIA casa com null) e pagina no cliente', () => {
    const itens = [
      { id: 1, categoria: { id: 'a', codigo: 'A', nome: 'A' } },
      { id: 2, categoria: null },
      { id: 3, categoria: { id: 'a', codigo: 'A', nome: 'A' } },
      { id: 4 },
    ];
    expect(filtrarPorCategoria(itens, 'A').map(i => i.id)).toEqual([1, 3]);
    expect(filtrarPorCategoria(itens, 'SEM_CATEGORIA').map(i => i.id)).toEqual([2, 4]);
    expect(filtrarPorCategoria(itens, null).length).toBe(4);

    const filtrados = filtrarPorCategoria(itens, 'SEM_CATEGORIA');
    expect(filtrados.length).toBe(2);
    expect(paginarLocal([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
    expect(paginarLocal([1, 2, 3], 4, 2)).toEqual([]);
  });

  it('monta opcoes do filtro marcando categorias inativas', () => {
    expect(opcoesFiltroCategoria([
      { codigo: 'A', nome: 'Ativa', ativo: true },
      { codigo: 'B', nome: 'Velha', ativo: false },
    ])).toEqual([
      { label: 'Sem categoria', value: 'SEM_CATEGORIA' },
      { label: 'Ativa', value: 'A' },
      { label: 'Velha (inativa)', value: 'B' },
    ]);
  });

  it('resolve categoria nos catalogos na ordem e devolve null sem id', () => {
    const ativas = [{ id: '1', exigeDetalhe: false }];
    const todas = [{ id: '1', exigeDetalhe: true }, { id: '2', exigeDetalhe: true }];
    expect(resolverCategoria('1', ativas, todas)?.exigeDetalhe).toBeFalse();
    expect(resolverCategoria('2', ativas, todas)?.exigeDetalhe).toBeTrue();
    expect(resolverCategoria('9', ativas, todas)).toBeNull();
    expect(resolverCategoria(null, ativas)).toBeNull();
  });

  it('limpar categoria so onde ja nao ha categoria gravada nem obrigatoriedade', () => {
    expect(podeLimparCategoria({ modoEdicao: true, linhaNova: false, categoriaOriginalId: null })).toBeTrue();
    expect(podeLimparCategoria({ modoEdicao: true, linhaNova: false, categoriaOriginalId: 'x' })).toBeFalse();
    expect(podeLimparCategoria({ modoEdicao: true, linhaNova: true, categoriaOriginalId: null })).toBeFalse();
    expect(podeLimparCategoria({ modoEdicao: false, linhaNova: true, categoriaOriginalId: null })).toBeFalse();
  });

  it('linha nova nao herda o detalhe exigido pela categoria original', () => {
    const base = { modoEdicao: true, categoriaId: null, categoriaOriginalId: 'x', exigeDetalhe: true, justificativa: 'curta' };
    expect(validarLinhaCategoria({ ...base, linhaNova: false })).toEqual({ justificativaCurta: true });
    expect(validarLinhaCategoria({ ...base, linhaNova: true })).toEqual({ categoriaObrigatoria: true });
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

describe('montarDadosGraficoCategorias', () => {
  it('usa cinza neutro e rotulo "Sem categoria" para codigo nulo', () => {
    const dados = montarDadosGraficoCategorias([
      { codigo: 'A', nome: 'Alfa', quantidadeFuncionarios: 4 },
      { codigo: null, nome: 'qualquer', quantidadeFuncionarios: 1 },
    ]);
    expect(dados.labels).toEqual(['Alfa', 'Sem categoria']);
    expect(dados.data).toEqual([4, 1]);
    expect(dados.colors[1]).toBe(SEM_CATEGORIA_COR);
    expect(dados.colors[0]).not.toBe(SEM_CATEGORIA_COR);
  });
});
