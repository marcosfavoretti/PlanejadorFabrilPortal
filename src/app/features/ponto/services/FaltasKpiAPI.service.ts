import { Injectable } from '@angular/core';
import {
  PaginatedResRankingFaltasDTODto,
  pontoKPIControllerListarDiasDeFalta,
  PontoKPIControllerListarDiasDeFaltaQueryParams,
  pontoKPIControllerRankingFaltas,
  PontoKPIControllerRankingFaltasQueryParams,
  pontoKPIControllerResumirFaltas,
  PontoKPIControllerResumirFaltasQueryParams,
  ResFaltasFuncionarioDTO,
  ResKpiFaltasResumoDTO,
} from '@/api/relogio';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FaltasKpiAPIService {
  /** Retorna null para líder sem centro de custo vinculado. */
  getResumo(params: PontoKPIControllerResumirFaltasQueryParams): Observable<ResKpiFaltasResumoDTO | null> {
    return from(pontoKPIControllerResumirFaltas(params) as Promise<ResKpiFaltasResumoDTO | null>);
  }

  getRanking(params: PontoKPIControllerRankingFaltasQueryParams): Observable<PaginatedResRankingFaltasDTODto> {
    return from(pontoKPIControllerRankingFaltas(params) as Promise<PaginatedResRankingFaltasDTODto>);
  }

  getDiasDeFalta(
    matricula: string,
    params: PontoKPIControllerListarDiasDeFaltaQueryParams,
  ): Observable<ResFaltasFuncionarioDTO> {
    return from(pontoKPIControllerListarDiasDeFalta(matricula, params) as Promise<ResFaltasFuncionarioDTO>);
  }
}
