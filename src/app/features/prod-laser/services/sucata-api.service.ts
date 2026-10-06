import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { resolveRuntimeUrl } from '@/app/shared/config/runtime-app-config';
import { Observable, map } from 'rxjs';
import {
  FuncionarioSucata,
  IndicadoresSucata,
  PesagemSucata,
  PesagemSucataPayload,
  ResumoSucata,
  ReporteSucataResultado,
} from '../models/sucata.model';

const SUCATA_API_PATH = '/api';

interface FuncionarioSucataResponse {
  MATRICULA: string;
  NOME: string;
}

@Injectable({ providedIn: 'root' })
export class SucataApiService {
  private readonly http = inject(HttpClient);

  private get apiUrl(): string {
    return resolveRuntimeUrl(SUCATA_API_PATH);
  }

  listarPesagens(inicio: string, fim: string): Observable<PesagemSucata[]> {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<PesagemSucata[]>(`${this.apiUrl}/sucata`, { params });
  }

  listarFuncionarios(): Observable<FuncionarioSucata[]> {
    return this.http
      .get<FuncionarioSucataResponse[]>(`${this.apiUrl}/sucata/funcionarios`)
      .pipe(
        map((funcionarios) =>
          funcionarios.map(({ MATRICULA, NOME }) => ({
            matricula: MATRICULA,
            nome: NOME,
          })),
        ),
      );
  }

  criarPesagem(payload: PesagemSucataPayload): Observable<PesagemSucata> {
    return this.http.post<PesagemSucata>(`${this.apiUrl}/sucata`, payload);
  }

  atualizarPesagem(
    id: number,
    payload: Partial<PesagemSucataPayload>,
  ): Observable<PesagemSucata> {
    return this.http.put<PesagemSucata>(`${this.apiUrl}/sucata/${id}`, payload);
  }

  excluirPesagem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sucata/${id}`);
  }

  listarPendentes(): Observable<PesagemSucata[]> {
    return this.http
      .get<{ itens: PesagemSucata[] }>(`${this.apiUrl}/sucata/pendentes`)
      .pipe(map((response) => response.itens));
  }

  reportarPesagens(ids: number[]): Observable<ReporteSucataResultado> {
    return this.http.post<ReporteSucataResultado>(
      `${this.apiUrl}/sucata/reportar`,
      { ids },
    );
  }

  reportarPesagem(id: number): Observable<PesagemSucata> {
    return this.http.post<PesagemSucata>(
      `${this.apiUrl}/sucata/${id}/reportar`,
      {},
    );
  }

  desfazerReporte(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sucata/${id}/reportar`);
  }

  obterResumo(): Observable<ResumoSucata> {
    return this.http.get<ResumoSucata>(
      `${this.apiUrl}/sucata/indicadores/resumo`,
    );
  }

  obterIndicadores(
    agrupamento: string,
    inicio: string,
    fim: string,
    tipo: 'gerada' | 'reportada' = 'gerada',
  ): Observable<IndicadoresSucata> {
    const params = new HttpParams()
      .set('tipo', tipo)
      .set('agrupamento', agrupamento)
      .set('inicio', inicio)
      .set('fim', fim);
    return this.http.get<IndicadoresSucata>(
      `${this.apiUrl}/sucata/indicadores`,
      { params },
    );
  }
}
