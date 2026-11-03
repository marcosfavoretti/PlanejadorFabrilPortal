import type { FolhaHoraExtraStatus } from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';

/** Status exibidos nos filtros operacionais (sem o "APROVADO", que tem tela própria). */
export const FOLHA_HE_STATUS_OPERACIONAL: FolhaHoraExtraStatus[] = [
  'RASCUNHO',
  'AGUARDANDO_COORDENACAO',
  'AGUARDANDO_DIRETORIA',
  'REJEITADO_COORDENACAO',
  'REJEITADO_DIRETORIA',
];

export const FOLHA_HE_STATUS_TODOS: FolhaHoraExtraStatus[] = [
  ...FOLHA_HE_STATUS_OPERACIONAL.slice(0, 3),
  'APROVADO',
  ...FOLHA_HE_STATUS_OPERACIONAL.slice(3),
];

/** Severidade (cor) da tag de status de uma folha de HE. */
export function severidadeStatusFolhaHE(status: FolhaHoraExtraStatus): 'secondary' | 'info' | 'warn' | 'success' | 'danger' {
  switch (status) {
    case 'RASCUNHO': return 'secondary';
    case 'AGUARDANDO_COORDENACAO': return 'info';
    case 'AGUARDANDO_DIRETORIA': return 'warn';
    case 'APROVADO': return 'success';
    case 'REJEITADO_COORDENACAO':
    case 'REJEITADO_DIRETORIA':
      return 'danger';
  }
}
