import { formatDateIso, intervaloParaParams } from './data-iso';

describe('data-iso', () => {
  it('formata a data local sem deslocar o dia', () => {
    expect(formatDateIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('usa o inicio como fim quando o intervalo tem uma data so', () => {
    expect(intervaloParaParams([new Date(2026, 6, 9)])).toEqual({ dataInicio: '2026-07-09', dataFim: '2026-07-09' });
    expect(intervaloParaParams([new Date(2026, 6, 9), new Date(2026, 6, 12)]).dataFim).toBe('2026-07-12');
    expect(intervaloParaParams(null)).toEqual({ dataInicio: undefined, dataFim: undefined });
  });
});
