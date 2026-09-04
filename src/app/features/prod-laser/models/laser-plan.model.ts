import type { LaserBoardCardDto } from '@/api/proucao-fabrica';

export type LaserPlan = LaserBoardCardDto & {
  /** Código/número do item, quando informado pelo endpoint do quadro. */
  codItemCompon?: string;
  /** Estado transitório enquanto o backend confirma um movimento. */
  isMoving?: boolean;
  /** Destaque transitório para alteração recebida por SSE. */
  sseUpdated?: boolean;
};
export type LaserPlanColumnKind = 'available' | 'machine' | 'finished';

export interface LaserPlanPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface LaserPlanColumn {
  id: string;
  title: string;
  description: string;
  kind: LaserPlanColumnKind;
  plans: LaserPlan[];
  pagination: LaserPlanPagination;
  accent: string;
}
