import { Injectable, inject, signal } from "@angular/core";
import { SignalStore } from "@/@core/abstract/SignalStore.abstract";
import { PortariaApiService } from "@/app/features/portaria/api/PortariaApi.service";
import {
  VehicleResponseDto,
  VehicleResponseDtoStatusEnum,
  ControleVeiculosControllerFindAllQueryParamsStatusEnum
} from "@/api/portaria";
import { Observable, from, map, catchError, of, combineLatest, Subject } from "rxjs";
import { readDevAuthToken } from '@/app/core/auth/utils/auth-token';
import { resolveRuntimeUrl } from '@/app/shared/config/runtime-app-config';

export enum VeiculoStatusEnum {
  DENTRO = 'DENTRO',
  FORA = 'FORA'
}

export enum MovimentacaoEventoEnum {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA'
}

export interface VeiculoDTO {
  placa: string;
  modelo: string;
  ano: number;
  cor?: string;
  status_atual: VeiculoStatusEnum;
  ultima_movimentacao: string;
  fotoUrl?: string;
}

export interface MovimentacaoDTO {
  id: string;
  veiculo_ref: string;
  evento: MovimentacaoEventoEnum;
  timestamp: string;
  permanencia_minutos?: number;
  fotoUrl?: string;
}

export interface PortariaKPIDTO {
  totalInside: number;
  totalToday: number;
  entriesToday: number;
  exitsToday: number;
  avgVehiclesPerHour?: number;
  fluxoPorHora: { time: string; entries: number; exits: number }[];
  mixPorTipo: { tipo: string; quantidade: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class PortariaStoreService extends SignalStore<any> {
  private portariaApi = inject(PortariaApiService);

  // SSE & Refresh signals
  private refreshSubject = new Subject<void>();
  public refresh$ = this.refreshSubject.asObservable();

  private lastDetectedVehicleSubject = new Subject<VeiculoDTO>();
  public lastDetectedVehicle$ = this.lastDetectedVehicleSubject.asObservable();

  // State
  kpis = signal<PortariaKPIDTO | null>(null);
  lastDetected = signal<VeiculoDTO | null>(null);

  constructor() {
    super();
    this.lastDetectedVehicle$.subscribe((v: VeiculoDTO) => this.lastDetected.set(v));
  }

  triggerRefresh() {
    this.refreshSubject.next();
  }

  triggerVehicleDetection(vehicle: VeiculoDTO) {
    this.lastDetectedVehicleSubject.next(vehicle);
  }

  override refresh(): Observable<any> {
    // Implementação básica de refresh para o SignalStore
    return of(null);
  }

  getKPIs(query?: any): Observable<PortariaKPIDTO> {
    const params: any = {};
    if (query) {
      Object.keys(query).forEach(key => {
        const val = query[key];
        if (val !== null && val !== undefined && val !== '') {
          if (key === 'status') {
            const mapped = this.mapStatusToBackend(val);
            if (mapped) params.status = mapped;
          } else {
            params[key] = val;
          }
        }
      });
    }

    return this.portariaApi.getKPIs(params).pipe(
      combineLatestWith(this.portariaApi.listarVeiculos({ ...params, page: 0, limit: 100 })),
      map(([kpis, response]: [any, any]) => {
        const movements = response?.data || [];

        // 2. Calcular Mix por Tipo (Utilizando apenas o Modelo conforme solicitado)
        const mixMap = new Map<string, number>();
        movements.forEach((m: any) => {
          const modelo = (m.modelo || '').trim() || 'Desconhecido';
          mixMap.set(modelo, (mixMap.get(modelo) || 0) + 1);
        });

        const treatedKpis: PortariaKPIDTO = {
          totalInside: kpis.totalInside || 0,
          totalToday: (kpis.entriesToday || 0) + (kpis.exitsToday || 0),
          entriesToday: kpis.entriesToday || 0,
          exitsToday: kpis.exitsToday || 0,
          avgVehiclesPerHour: kpis.avgVehiclesPerHour || 0,
          fluxoPorHora: kpis.histogram || [], 
          mixPorTipo: Array.from(mixMap.entries())
            .map(([tipo, quantidade]) => ({ tipo, quantidade }))
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 5)
        };

        this.kpis.set(treatedKpis);
        return treatedKpis;
      }),
      catchError(err => {
        console.error('Erro ao processar KPIs:', err);
        return of({
          totalInside: 0, totalToday: 0, entriesToday: 0, exitsToday: 0,
          fluxoPorHora: [], mixPorTipo: []
        });
      })
    );
  }

  listarVeiculos(query: any): Observable<any> {
    const params: any = {
      page: Number.isInteger(query?.page) && query.page >= 0 ? query.page : 0,
      limit: query?.limit || 10
    };

    // Somente adiciona à query o que não for nulo/vazio
    Object.keys(query || {}).forEach(key => {
      const val = query[key];
      if (key !== 'page' && key !== 'limit' && val !== null && val !== undefined && val !== '') {
        if (key === 'status') {
          const mapped = this.mapStatusToBackend(val);
          if (mapped) params.status = mapped;
        } else {
          params[key] = val;
        }
      }
    });

    return this.portariaApi.listarVeiculos(params).pipe(
      map((response: any) => ({
        data: (response?.data || []).map((v: any) => this.mapToVeiculoDTO(v)),
        total: response?.total || 0,
        page: response?.page ?? 0,
        limit: response?.limit || 10,
        totalPages: response?.totalPages || 0
      }))
    );
  }

  /**
   * Busca detalhes e histórico de um veículo específico com suporte a paginação.
   * Por padrão traz os últimos 10 movimentos.
   */
  getDetalheVeiculo(placa: string, page: number = 0, limit: number = 10): Observable<{ veiculo: VeiculoDTO; historico: MovimentacaoDTO[]; total: number }> {
    return this.portariaApi.listarVeiculos({ placa, page, limit }).pipe(
      map(response => {
        if (!response?.data || response.data.length === 0) throw new Error('Veículo não encontrado');

        // O primeiro item do array de qualquer página serve para pegar os dados cadastrais do veículo
        const veiculo = this.mapToVeiculoDTO(response.data[0]);
        const historico = response.data.map((v: any) => this.mapToMovimentacaoDTO(v));

        return { veiculo, historico, total: response.total || 0 };
      })
    );
  }

  getVideoSession(): Observable<{ manifestUrl: string }> {
    const token = readDevAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return from(fetch(this.resolvePortariaUrl('/video/session'), {
      method: 'POST',
      headers,
      credentials: 'include',
    }).then(r => {
      if (!r.ok) throw new Error('Falha ao obter sessão de vídeo');
      return r.json();
    })).pipe(
      map((session) => ({
        ...session,
        manifestUrl: this.normalizeVideoUrl(session?.manifestUrl),
      }))
    );
  }

  private normalizeVideoUrl(url?: string): string {
    if (!url) return '';
    try {
      return resolveRuntimeUrl(url);
    } catch {
      return url;
    }
  }

  private resolvePortariaUrl(path: string): string {
    return resolveRuntimeUrl(`/api/controle-portaria${path}`);
  }

  private mapStatusToBackend(status?: VeiculoStatusEnum): ControleVeiculosControllerFindAllQueryParamsStatusEnum | undefined {
    if (!status) return undefined;
    return status === VeiculoStatusEnum.DENTRO
      ? ControleVeiculosControllerFindAllQueryParamsStatusEnum.INSIDE
      : ControleVeiculosControllerFindAllQueryParamsStatusEnum.OUTSIDE;
  }

  public mapToVeiculoDTO(v: VehicleResponseDto): VeiculoDTO {
    const constructedFoto = (v as any).foto
      ? this.resolvePortariaUrl(`/veiculos/foto/${(v as any).foto}`)
      : undefined;
    const fotoUrl = v.fotoUrl || constructedFoto;

    return {
      placa: v.placa,
      modelo: v.modelo || 'Desconhecido',
      ano: v.ano,
      cor: v.cor,
      status_atual: v.status === VehicleResponseDtoStatusEnum.INSIDE ? VeiculoStatusEnum.DENTRO : VeiculoStatusEnum.FORA,
      ultima_movimentacao: (v.createdAt || new Date()).toString(),
      fotoUrl
    };
  }

  public mapToMovimentacaoDTO(v: VehicleResponseDto): MovimentacaoDTO {
    const constructedFoto = (v as any).foto
      ? this.resolvePortariaUrl(`/veiculos/foto/${(v as any).foto}`)
      : undefined;
    const fotoUrl = v.fotoUrl || constructedFoto;

    return {
      id: v.id,
      veiculo_ref: v.placa,
      evento: v.status === VehicleResponseDtoStatusEnum.INSIDE ? MovimentacaoEventoEnum.ENTRADA : MovimentacaoEventoEnum.SAIDA,
      timestamp: (v.createdAt || new Date()).toString(),
      permanencia_minutos: (v.status === VehicleResponseDtoStatusEnum.OUTSIDE && v.updatedAt && v.createdAt) ?
        Math.floor((new Date(v.updatedAt).getTime() - new Date(v.createdAt).getTime()) / 60000) : undefined,
      fotoUrl
    };
  }
}

// Helper for combineLatest as pipe operator
function combineLatestWith<T, R>(other: Observable<R>) {
  return (source: Observable<T>) => combineLatest([source, other]);
}
