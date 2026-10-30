/** Data local no formato `yyyy-MM-dd` (sem conversão para UTC, ao contrário de `toISOString`). */
export function formatDateIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Converte o intervalo do p-datepicker em `dataInicio`/`dataFim`; sem fim, usa o início. */
export function intervaloParaParams(range: Date[] | null | undefined): { dataInicio?: string; dataFim?: string } {
  const [inicio, fim] = range ?? [];
  const final = fim ?? inicio;
  return {
    dataInicio: inicio ? formatDateIso(inicio) : undefined,
    dataFim: final ? formatDateIso(final) : undefined,
  };
}
