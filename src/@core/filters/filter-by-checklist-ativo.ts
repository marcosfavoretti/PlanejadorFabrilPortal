import { FilterItens } from "../abstract/filter-item.abstract";
import type { ResEstruturaItemTreeDTO } from "@/api/estrutura";

export class FilterCheckListActive extends FilterItens{
    constructor(){
        super('c/ checklist ativo', 'success')
    }
    protected override filterStrategy(itemtree: ResEstruturaItemTreeDTO): boolean {
        return (itemtree as any).checkListAvaiable
        // return itemtree.checkListAvaiable 

    }
}
