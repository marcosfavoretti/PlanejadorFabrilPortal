import type { ResEstruturaItemTreeDTO } from "@/api/estrutura";

export abstract class FilterItens {
    constructor(readonly filternome: string, readonly tagColor: 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined) { }

    protected abstract filterStrategy(itemtree: ResEstruturaItemTreeDTO): boolean;
    /**metodo de hook .:. nao pode ser sobreescrito */
    public filterProcess(itemtree: ResEstruturaItemTreeDTO, frstExec: boolean = true): ResEstruturaItemTreeDTO | undefined {
        const item = itemtree as any;
        if (!item.partcode) return undefined;
        let currentNode: ResEstruturaItemTreeDTO | undefined = undefined;
        if (frstExec || this.filterStrategy(itemtree)) {
            currentNode = {
                pa: item.pa,
                medida: item.medida,
                qtd: item.qtd,
                filhos: [],
                item_status: item.item_status,
                partcode: item.partcode,
                imagem: item.imagem,
                ehControle: item.ehControle,
                checkListAvaiable: item.checkListAvaiable,
                paRecorded: item.paRecorded
            } as any;
        }
        if (item.filhos && item.filhos.length > 0) {
            item.filhos.forEach((child: ResEstruturaItemTreeDTO) => {
                const collectedChild = this.filterProcess(child, false);
                if (collectedChild) {
                    if (currentNode) {
                        (currentNode as any).filhos.push(collectedChild);
                    } else {
                        currentNode = collectedChild;
                    }
                }
            });
        }
        return currentNode; // Retorna o nó filtrado, ou null se não atender ao critério
    }

}
