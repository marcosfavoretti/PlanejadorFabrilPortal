import { FilterItens } from "../abstract/filter-item.abstract";
import type { ResEstruturaItemTreeDTO } from "@/api/estrutura";

export class FilterByComImagem extends FilterItens {
   constructor(){
      super('apenas c/ img', 'warning')
   }
   protected override filterStrategy(itemtree: ResEstruturaItemTreeDTO): boolean {
    return (itemtree as any).imagem? true : false
   }
}
