import { Injectable } from '@angular/core';
import {
  funcionarioControllerConsultaFuncionarios,
  funcionarioControllerConsultarCentroDeCustoMethod,
  funcionarioControllerConsultarPresencaFuncionarios,
  funcionarioControllerConsultarTurnoFuncionario,
  FuncionarioControllerConsultaFuncionariosQueryParams,
  FuncionarioControllerConsultarPresencaFuncionariosQueryParams,
  PaginatedResFuncionarioListagemDTODto,
  PaginatedResPresencaFuncionarioDTODto,
  ResCentroDeCustoDTO,
  ResTurnoFuncionarioDTO,
} from '@/api/relogio';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FuncionariosAPIService {
  constructor() {}

  getFuncionarios(dto: FuncionarioControllerConsultaFuncionariosQueryParams): Observable<PaginatedResFuncionarioListagemDTODto> {
    return from(funcionarioControllerConsultaFuncionarios(dto) as unknown as Promise<PaginatedResFuncionarioListagemDTODto>);
  }

  getCentroDeCusto(): Observable<ResCentroDeCustoDTO[]> {
    return from(funcionarioControllerConsultarCentroDeCustoMethod() as unknown as Promise<ResCentroDeCustoDTO[]>);
  }

  getPresencaFuncionarios(
    params: FuncionarioControllerConsultarPresencaFuncionariosQueryParams,
  ): Observable<PaginatedResPresencaFuncionarioDTODto> {
    return from(
      funcionarioControllerConsultarPresencaFuncionarios(params) as Promise<PaginatedResPresencaFuncionarioDTODto>
    );
  }

  getTurnoFuncionario(matricula: string): Observable<ResTurnoFuncionarioDTO> {
    return from(funcionarioControllerConsultarTurnoFuncionario(matricula) as unknown as Promise<ResTurnoFuncionarioDTO>);
  }
}
