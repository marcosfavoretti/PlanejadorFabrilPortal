// context/contexto-fabrica.service.ts
import { Injectable, inject } from '@angular/core';
import { FabricaResponseDto } from '@/api';
import { SignalStore } from '@/@core/abstract/SignalStore.abstract';
import { FabricaService } from './Fabrica.service';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContextoFabricaService extends SignalStore<FabricaResponseDto> {
  private fabricaListeners: Array<(fabrica: FabricaResponseDto) => void> = [];

  fabricaService = inject(FabricaService);

  constructor() {
    super();

  }

  getFabrica(): FabricaResponseDto {
    return this.get()!;
  }

  refresh(fabricaId?: string): Observable<FabricaResponseDto> {
    if (!fabricaId) {
      console.log('entrou aqui na fabrica principa')
      return this.fabricaService.getFabricaPrincipal()
        .pipe(
          tap(fabrica => this.set(fabrica))
        );
    }
    return this.fabricaService.consultaFabrica({
      fabricaId
    }).pipe(
      tap(fabrica => this.set(fabrica))
    );
  }

  setFabrica(fabrica: FabricaResponseDto): void {
    console.log('[ContextoFabrica] Nova fábrica:', fabrica);
    this.set(fabrica);
  }

}
