// context/contexto-fabrica.service.ts
import { Injectable, effect, inject } from '@angular/core';
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

    effect(() => {
      const fabrica = this.item();
      if (fabrica) {
        this.fabricaListeners.forEach(fn => fn(fabrica));
      }
    });
  }

  getFabrica(): FabricaResponseDto {
    return this.get()!;
  }

  refreshFabricaPrincipal(): Observable<FabricaResponseDto> {
    return this.fabricaService.getFabricaPrincipal().pipe(
      tap(fabrica => this.set(fabrica))
    );
  }

  setFabrica(fabrica: FabricaResponseDto): void {
    console.log('[ContextoFabrica] Nova fábrica:', fabrica);
    this.set(fabrica);
  }

  subscribeFabricaChange(listener: (fabrica: FabricaResponseDto) => void): () => void {
    this.fabricaListeners.push(listener);

    const current = this.get();
    if (current) {
      listener(current);
    }

    return () => {
      this.fabricaListeners = this.fabricaListeners.filter(l => l !== listener);
    };
  }
}
