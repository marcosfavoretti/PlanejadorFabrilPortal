import {
  laserControllerBoard,
  laserControllerGenerateNestingPreview,
  laserControllerGetProgramDetails,
  laserControllerListBoardCards,
  laserControllerMoveCard,
  LaserBoardDto,
  LaserControllerBoardQueryParams,
  MoveLaserBoardCardDto,
  ProgramaLaserDetalheDto,
  PaginatedProducaoFabricaResumoDtoDto,
  ProducaoFabricaControllerListQueryParams,
  producaoFabricaControllerList,
} from '@/api/proucao-fabrica';
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { resolveRuntimeUrl } from '@/app/shared/config/runtime-app-config';

const LASER_BOARD_EVENTS_PATH = '/api/producao-fabrica/laser/board/events';
const LASER_BOARD_SYNC_EVENT = 'board-list-updated';

type LaserBoardQueryParams = LaserControllerBoardQueryParams & {
  /** Aceito pelo endpoint, mas ainda ausente do schema OpenAPI gerado. */
  initialLimit?: number;
};

export type LaserBoardSyncEvent = {
  event?: string;
  scope?: string;
  reason?: string;
};

@Injectable({
  providedIn: 'root',
})
export class ProducaoFabricaApiService {
  carregarQuadro(initialLimit = 10, search?: string): Observable<LaserBoardDto> {
    const params: LaserBoardQueryParams = {
      initialLimit,
      ...(search ? { search } : {}),
    };
    return from(laserControllerBoard(params));
  }

  carregarCardsDaLista(listId: string, page: number, limit = 10, search?: string) {
    return from(laserControllerListBoardCards(listId, {
      page,
      limit,
      ...(search ? { search } : {}),
    }));
  }

  moverCard(numPrograma: string, payload: MoveLaserBoardCardDto) {
    return from(laserControllerMoveCard(numPrograma, payload));
  }

  obterDetalhesDoPrograma(numPrograma: string): Observable<ProgramaLaserDetalheDto[]> {
    return from(laserControllerGetProgramDetails(numPrograma));
  }

  gerarPreviewDoNesting(numPrograma: string): Observable<unknown> {
    return from(laserControllerGenerateNestingPreview({ program: numPrograma }));
  }

  /**
   * Abre o stream SSE definido no Kubb para notificar alterações no quadro.
   * O EventSource já tenta se reconectar automaticamente quando a conexão cai.
   */
  escutarEventosDoQuadro(): Observable<LaserBoardSyncEvent> {
    return new Observable<LaserBoardSyncEvent>((subscriber) => {
      const eventSource = new EventSource(
        resolveRuntimeUrl(LASER_BOARD_EVENTS_PATH),
        { withCredentials: true },
      );

      const readPayload = (event: Event): LaserBoardSyncEvent | undefined => {
        try {
          return JSON.parse((event as MessageEvent<string>).data) as LaserBoardSyncEvent;
        } catch {
          return undefined;
        }
      };

      const notifyBoardUpdate = (event: Event) => {
        const payload = readPayload(event);
        if (payload) subscriber.next(payload);
      };

      // Também aceita o formato em que o backend envia `event` dentro do JSON,
      // sem usar o campo `event:` do protocolo SSE.
      const notifyDefaultMessage = (event: MessageEvent<string>) => {
        const payload = readPayload(event);
        if (payload?.event === LASER_BOARD_SYNC_EVENT) subscriber.next(payload);
      };

      eventSource.addEventListener(LASER_BOARD_SYNC_EVENT, notifyBoardUpdate);
      eventSource.onmessage = notifyDefaultMessage;

      // Não finalizamos o observable em caso de erro: o EventSource reconecta
      // automaticamente e a página continua recebendo os próximos eventos.
      eventSource.onerror = () => undefined;

      return () => {
        eventSource.removeEventListener(LASER_BOARD_SYNC_EVENT, notifyBoardUpdate);
        eventSource.onmessage = null;
        eventSource.close();
      };
    });
  }

  listarPlanosDisponiveis(
    params: ProducaoFabricaControllerListQueryParams,
  ): Observable<PaginatedProducaoFabricaResumoDtoDto> {
    return from(producaoFabricaControllerList(params));
  }
}
