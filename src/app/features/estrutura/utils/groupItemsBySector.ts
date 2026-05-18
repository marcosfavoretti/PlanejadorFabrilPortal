import { Sectors } from "@/@core/enums/sectors";
import type { GetAnaliseResDTO } from "@/api/estrutura";
import { estruturaApiEndpoints } from "@/app/features/estrutura/config/estrutura-api-endpoints";

function buildEstruturaImageUrl(partcode: string): string {
  const normalizedPartcode = partcode.trim().replace(/\s+/g, "").toUpperCase();
  const baseUrl = estruturaApiEndpoints.image();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}partcode=${encodeURIComponent(normalizedPartcode)}`;
}

function readPartcode(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const partcode = value as Record<string, unknown>;
    return String(partcode['partcode'] ?? partcode['codigo'] ?? partcode['codItem'] ?? partcode['id'] ?? '');
  }

  return '';
}

/**
 * Normaliza o nome do setor vindo da API para um valor do enum Sectors.
 * Exemplo: "CORTE LASER" -> Sectors.LASER, "SOLDA ROBO" -> Sectors.SOLDAROBO
 */
function normalizeSectorName(rawName: string): string {
  const cleaned = rawName.toUpperCase().replace(/\s/g, '');

  // 1. Tenta match exato primeiro (ignorando espaços)
  for (const sector of Object.values(Sectors)) {
    const mask = sector.toUpperCase().replace(/\s/g, '');
    if (cleaned === mask) return sector;
  }

  // 2. Lógica de fallback específica para casos ambíguos ou conhecidos
  if (cleaned.includes('SOLDA')) {
    if (cleaned.includes('ROBO') || cleaned.includes('ROB')) return Sectors.SOLDAROBO;
    return Sectors.SOLDA;
  }
  if (cleaned.includes('PINTURA')) {
    if (cleaned.includes('PO') || cleaned.includes('FABS')) return Sectors.PINTURAPO;
    return Sectors.PINTURA;
  }
  if (cleaned.includes('LASER')) return Sectors.LASER;
  if (cleaned.includes('DOBRA')) return Sectors.DOBRA;
  if (cleaned.includes('TIPAGEM')) return Sectors.TIPAGEM;
  if (cleaned.includes('MONTAGEM')) return Sectors.MONTAGEM;
  if (cleaned.includes('BANHO')) return Sectors.BANHO;
  if (cleaned.includes('LIXA')) return Sectors.LIXA;

  // 3. Match parcial como último recurso
  for (const sector of Object.values(Sectors)) {
    const mask = sector.toUpperCase().replace(/\s/g, '');
    if (mask.includes(cleaned) || cleaned.includes(mask)) return sector;
  }

  return rawName;
}

export function groupItemsBySector(
  analytics: GetAnaliseResDTO[]
): Record<string, Record<string, unknown>[]> {
  const sectorGroups: Record<string, Record<string, unknown>[]> = {};

  analytics.forEach((setorAnalise) => {
    if (!setorAnalise?.setor?.nome || !Array.isArray(setorAnalise.analise)) {
      return;
    }

    const sectorName = normalizeSectorName(setorAnalise.setor.nome);

    if (!sectorGroups[sectorName]) {
      sectorGroups[sectorName] = [];
    }

    setorAnalise.analise.forEach((analiseItem) => {
      if (!analiseItem?.item) {
        return;
      }

      const metrics: Record<string, string> = {};
      (analiseItem.metricas ?? []).forEach((metrica) => {
        let name = metrica.nome;
        const lowerName = name.toLowerCase();
        if (lowerName.includes('tempo total') || lowerName.includes('tempo proc') || lowerName === 'tempo' || lowerName.includes('tempoprod') || lowerName.includes('total time')) {
          name = 'Total Time';
        }
        if (lowerName.includes('m^2 custo') || lowerName.includes('m2 custo')) name = 'M^2 custo';
        if (lowerName === 'm^2' || lowerName === 'm2' || lowerName.includes('metro quadrado')) name = 'M^2';
        if (lowerName.includes('quimico')) name = 'Tem Quimico';
        if (lowerName.includes('tinta')) name = 'Tem Tinta';

        let valor: any = metrica.valor ? metrica.valor.replace(',', '.') : '0';
        if (name === 'Total Time' || name === 'M^2' || name === 'M^2 custo') {
          const numericValue = Number(valor);
          valor = isNaN(numericValue) ? 0 : numericValue;
        }

        metrics[name] = valor;
      });

      sectorGroups[sectorName].push({
        ...analiseItem.item,
        partcode: readPartcode((analiseItem.item as any).partcode),
        imagem: buildEstruturaImageUrl(readPartcode((analiseItem.item as any).partcode)),
        pa: analiseItem.item.itemCliente,
        item_status: analiseItem.item.status,
        isControllItem: analiseItem.item.ehControle,
        sector: {
          name: setorAnalise.setor.nome,
          code: setorAnalise.setor.codigo,
          metrics,
        },
      });
    });
  });

  return sectorGroups;
}
