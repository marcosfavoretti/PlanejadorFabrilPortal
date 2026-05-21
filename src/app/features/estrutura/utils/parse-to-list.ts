import type { ResEstruturaItemTreeDTO } from "@/api/estrutura";

export function parseToList(
    item: ResEstruturaItemTreeDTO,
    skipRoot: boolean = false,
    imageProvider?: (partcode: string) => string
): ResEstruturaItemTreeDTO[] {
    const result: ResEstruturaItemTreeDTO[] = [];
    
    function traverse(node: any, isRoot: boolean) {
        if (!node) return;
        if (!isRoot) {
            result.push(node);
        }
        const filhos = node.filhos || node.children;
        if (filhos && Array.isArray(filhos)) {
            filhos.forEach((filho: any) => traverse(filho, false));
        }
    }

    traverse(item, skipRoot);
    
    const converted = result.map(node => convertToTreeNode(node, imageProvider));
    
    // Unicidade por partcode, mantendo itens de controle separados dos demais.
    const seen = new Map<string, ResEstruturaItemTreeDTO>();
    const unique: ResEstruturaItemTreeDTO[] = [];
    
    for (const node of converted) {
        if (node.partcode) {
            const dedupeKey = `${node.partcode}::${(node as any).ehControle ? 'controle' : 'comum'}`;
            const existing = seen.get(dedupeKey);
            if (existing) {
                if (existing.qtd !== undefined && node.qtd !== undefined) {
                    existing.qtd += node.qtd;
                }
                (existing as any).checkListAvaiable = Boolean((existing as any).checkListAvaiable || (node as any).checkListAvaiable);
                (existing as any).paRecorded = Boolean((existing as any).paRecorded || (node as any).paRecorded);
                (existing as any).collected = Boolean((existing as any).collected || (node as any).collected);
            } else {
                seen.set(dedupeKey, node);
                unique.push(node);
            }
        } else {
            unique.push(node);
        }
    }
    
    return unique;
}

function convertToTreeNode(
    item: ResEstruturaItemTreeDTO,
    imageProvider?: (partcode: string) => string
): ResEstruturaItemTreeDTO {
    const itemData = item as any;
    const partcode = itemData.partcode;

    return {
        pa : itemData.pa,
        medida: itemData.medida,
        qtd: itemData.qtd || 0,
        filhos: [],
        children: [],
        item_status: itemData.item_status,
        partcode,
        imagem: itemData.imagem || (partcode && imageProvider ? imageProvider(partcode) : undefined),
        ehControle: itemData.ehControle ?? false,
        checkListAvaiable :itemData.checkListAvaiable,
        paRecorded: itemData.paRecorded,
        collected: false
    } as any;
}
