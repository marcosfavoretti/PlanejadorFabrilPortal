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
    
    // Unicidade por partcode e soma de qtd
    const seen = new Map<string, ResEstruturaItemTreeDTO>();
    const unique: ResEstruturaItemTreeDTO[] = [];
    
    for (const node of converted) {
        if (node.partcode) {
            const existing = seen.get(node.partcode);
            if (existing) {
                if (existing.qtd !== undefined && node.qtd !== undefined) {
                    existing.qtd += node.qtd;
                }
            } else {
                seen.set(node.partcode, node);
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
        checkListAvaiable :itemData.checkListAvaiable,
        paRecorded: itemData.paRecorded,
        collected: false
    } as any;
}
