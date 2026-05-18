import { Injectable, inject } from '@angular/core';
import { PortariaStoreService } from '@/app/features/portaria/store/PortariaStore.service';
import { resolveRuntimeUrl } from '@/app/shared/config/runtime-app-config';

@Injectable({
  providedIn: 'root'
})
export class PortariaWsService {
  private portariaStore = inject(PortariaStoreService);
  private eventSource?: EventSource;
  private reconnectTimeout?: any;
  private shouldReconnect = false;

  connect() {
    this.shouldReconnect = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.eventSource) {
      this.eventSource.close();
    }

    const url = resolveRuntimeUrl('/api/controle-portaria/veiculos/webhook/events');
    
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
      if (!this.shouldReconnect) return;

      console.error('[PortariaWsService] Erro na conexão SSE. Tentando reconectar em 5s...', error);
      this.eventSource?.close();
      this.eventSource = undefined;
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      this.reconnectTimeout = setTimeout(() => {
        if (!this.shouldReconnect) return;
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
    this.shouldReconnect = false;

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
