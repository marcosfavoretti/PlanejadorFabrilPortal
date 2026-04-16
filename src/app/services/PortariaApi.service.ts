import { Injectable } from "@angular/core";
import { Observable, from } from "rxjs";
import {
  controleVeiculosControllerFindAll,
  controleVeiculosControllerGetKpis,
} from "@/api/portaria";

@Injectable({
  providedIn: 'root'
})
export class PortariaApiService {
  getKPIs(query?: any) {
    return from(controleVeiculosControllerGetKpis(query));
  }

  listarVeiculos(query: any) {
    return from(controleVeiculosControllerFindAll(query));
  }
  
  // Mantenha apenas a chamada bruta, sem tratamento
}
