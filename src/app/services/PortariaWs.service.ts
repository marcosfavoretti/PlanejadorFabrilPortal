import { Injectable, inject } from '@angular/core';
import { PortariaStoreService } from './PortariaStore.service';

const BASE_URL = 'https://app.ethos.ind.br/api/controle-portaria';

@Injectable({
  providedIn: 'root'
})
export class PortariaWsService {
  private portariaStore = inject(PortariaStoreService);
  private eventSource?: EventSource;
  private reconnectTimeout?: any;

  constructor() {
    this.connect();
  }

  connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = `${BASE_URL}/veiculos/webhook/events`;
    
    console.log('[PortariaWsService] Conectando ao SSE:', url);
    
    this.eventSource = new EventSource(url, { withCredentials: true });

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[PortariaWsService] Mensagem recebida:', data);
        
        if (data.type === 'VEHICLE_EVENT' || data.type === 'HEARTBEAT') {
          if (data.type === 'VEHICLE_EVENT') {
            this.portariaStore.triggerRefresh();
            if (data.data) {
              const mapped = this.portariaStore.mapToVeiculoDTO(data.data);
              this.portariaStore.triggerVehicleDetection(mapped);
            }
          }
        }
      } catch (e) {
        console.error('[PortariaWsService] Erro ao processar mensagem SSE:', e);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('[PortariaWsService] Erro na conexão SSE. Tentando reconectar em 5s...', error);
      this.eventSource?.close();
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, 5000);
    };

    this.eventSource.onopen = () => {
      console.log('[PortariaWsService] Conexão SSE estabelecida com sucesso');
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = undefined;
      }
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }
}
