import { FilterItens } from "../abstract/filter-item.abstract";
import type { ResEstruturaItemTreeDTO } from "@/api/estrutura";

export class FilterRemoveRepetidos extends FilterItens{
    constructor(){
        super('remove repetidos', 'contrast')
    }
    private passed = new Set<string>();

    protected override filterStrategy(itemtree: ResEstruturaItemTreeDTO): boolean {
        const pc = (itemtree as any).partcode;
        if (this.passed.has(pc)) {
            console.log('repetido', pc);
            return false;
        }
        this.passed.add(pc);
        return true;
    }

    public override filterProcess(itemtree: ResEstruturaItemTreeDTO, frstExec: boolean = true): ResEstruturaItemTreeDTO | undefined {
        if (frstExec) {
            this.passed.clear();
        }
        return super.filterProcess(itemtree, frstExec);
    }
}
