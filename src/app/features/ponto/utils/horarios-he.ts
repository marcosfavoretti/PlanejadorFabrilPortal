export const HORARIOS_HE = ['06:00', '07:30', '12:00', '14:20', '15:48', '17:18', '18:00', '22:35', '01:19', '03:20'] as const;

export const HORARIO_HE_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isHorarioHEExcecao(value: unknown): boolean {
  const [hour = '', minute = ''] = String(value ?? '').trim().split(':');
  if (!hour || !minute) return false;
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  return !(HORARIOS_HE as readonly string[]).includes(time);
}

export function temExcecaoHE(funcionario: { inicioHE?: unknown; fimHE?: unknown }): boolean {
  return isHorarioHEExcecao(funcionario.inicioHE) || isHorarioHEExcecao(funcionario.fimHE);
}
