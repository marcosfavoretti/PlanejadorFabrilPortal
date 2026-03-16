import { SafeResourceUrl } from "@angular/platform-browser";

export interface PowerbiDataset {
    name: string;
    urlDataset: string;
    urlView: string;
    PowerbiDatasetsID: number;
    safeUrl?: SafeResourceUrl//esse atributo sera colocado dps, nao vem com a response...seria melhor passar para um classe isso aqui
}