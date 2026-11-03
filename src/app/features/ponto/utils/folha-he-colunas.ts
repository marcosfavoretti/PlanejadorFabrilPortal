import { categoriaLabel } from '@/app/features/ponto/utils/categoria-he';
import type { TableModel } from '@/app/shared/components/table-dynamic/table.model';

/** Coluna "Categoria" (chip) compartilhada entre as tabelas; `null` vira "Sem categoria". */
export function categoriaColumn(): TableModel['columns'][number] {
  return {
    alias: 'Categoria',
    field: 'categoria',
    isTag: true,
    filterable: false,
    sortable: false,
    tagLabelFn: value => categoriaLabel(value as { nome: string } | null),
    tagSeverityFn: value => value ? 'info' : 'secondary',
  };
}
