import { FilterItens } from "../abstract/filter-item.abstract";
import type { ResEstruturaItemTreeDTO } from "@/api/estrutura";

export class FilterByNotPa extends FilterItens{
    constructor(){
        super('filtra ≠ kits','secondary')
    }

    protected override filterStrategy(itemtree: ResEstruturaItemTreeDTO): boolean {
        return ((itemtree as any).pa as string).toLowerCase().indexOf('kit') === -1
    }
}
