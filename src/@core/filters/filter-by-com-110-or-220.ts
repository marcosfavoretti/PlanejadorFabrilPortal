import { FilterItens } from "../abstract/filter-item.abstract";
import type { ResEstruturaItemTreeDTO } from "@/api/estrutura";

export class FilterByCom110or220 extends FilterItens{
    constructor(){
        super('apenas 110/220', 'info')
    }
    protected override filterStrategy(itemtree: ResEstruturaItemTreeDTO): boolean {
        const partcode = (itemtree as any).partcode as string;
        return partcode.indexOf('-110-') !== -1 || partcode.indexOf('-220-') !== -1
    }
}
