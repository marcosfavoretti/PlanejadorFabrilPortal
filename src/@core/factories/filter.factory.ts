import { FilterItens } from "../abstract/filter-item.abstract";
import { FilterTypes } from "../enums/filtersTypes";
import { FilterByCom110or220 } from "../filters/filter-by-com-110-or-220";
import { FilterByComImagem } from "../filters/filter-by-com-imagem";
import { FilterByNaoComprado } from "../filters/filter-by-ncomprado";

export class FilterFactory{
    static readonly dictionary: Record<FilterTypes, FilterItens> = {
        "0": new FilterByComImagem(),
        "1": new FilterByCom110or220(),
        "2": new FilterByNaoComprado()
    }
    static build(param : FilterTypes){
        const strategyFilter = this.dictionary[param];
        if(!strategyFilter) throw new Error('nao foi possivel achar o filtro');
        return strategyFilter
    }
}