import { funcionarioControllerConsultaFuncionariosMethod, FuncionarioControllerConsultaFuncionariosMethodQueryParams, funcionarioControllerConsultarCentroDeCustoMethod, PaginatedResPontoFuncionarioDTODto, ResCentroDeCustoDTO } from "@/api/relogio";
import { Injectable } from "@angular/core";
import { from, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class FuncionariosAPIService {
    constructor() { }

    getFuncionarios(dto: FuncionarioControllerConsultaFuncionariosMethodQueryParams):
        Observable<PaginatedResPontoFuncionarioDTODto> {
        return from(
            funcionarioControllerConsultaFuncionariosMethod(dto)
                .then(response => {
                    return response;
                })
                .catch(err => {
                    throw err;
                })
        );
    }

    getCentroDeCusto(): Observable<ResCentroDeCustoDTO[]> {
        return from(
            funcionarioControllerConsultarCentroDeCustoMethod
                ()
                .then(response => {
                    return response;
                })
                .catch(err => {
                    throw err;
                })
        );
    }
}