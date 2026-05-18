import { FilterItens } from "../abstract/filter-item.abstract";
import type { ResEstruturaItemTreeDTO } from "@/api/estrutura";

export class FilterByNaoComprado extends FilterItens{
    constructor(){
        super('nao comprados', 'danger');
    }
    protected override filterStrategy(itemtree: ResEstruturaItemTreeDTO): boolean {
        return (itemtree as any).item_status !== "C"
    }
}
