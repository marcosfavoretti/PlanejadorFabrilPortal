import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { IShutDown } from '@/@core/abstract/IShutDown';
import { IStartup } from '@/@core/abstract/IStartup';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { UserService } from '@/app/core/user/services/User.service';
import { PedidoPlanejadosStoreService } from './PedidoPlanejadoStore.service';
import { ContextoFabricaService } from './ContextoFabrica.service';
import { GanttStoreService } from './GanttStore.service';
import { FabricaService } from './Fabrica.service';
import { FabricaMudancaStore } from './FabricaMudancaStore.service';

@Injectable({
  providedIn: 'root',
})
export class FabricaPageStartUpService implements IShutDown, IStartup {
  activatedRoute = inject(ActivatedRoute);
  userService = inject(UserService);
  userStore = inject(UserstoreService);
  fabricaService = inject(FabricaService);
  popUpService = inject(LoadingPopupService);
  mudancaStore = inject(FabricaMudancaStore);
  pedidoPlenejadoStore = inject(PedidoPlanejadosStoreService);
  fabricaStore = inject(ContextoFabricaService);
  ganttStore = inject(GanttStoreService);

  startup(fabricaId: string): void {
    this.startUp(fabricaId);
  }

  startUp(fabricaId: string): void {
    const flow$ = this.fabricaStore.initialize(fabricaId).pipe(
      switchMap(() =>
        forkJoin([
          this.mudancaStore.initialize(),
          this.pedidoPlenejadoStore.initialize(this.fabricaStore.item()?.fabricaId),
          this.ganttStore.initialize(this.fabricaStore.item()?.fabricaId),
        ]),
      ),
    );

    flow$.subscribe();
  }

  shutDown(): void {
    this.fabricaStore.resetStore();
    this.pedidoPlenejadoStore.resetStore();
    this.ganttStore.resetStore();
    this.mudancaStore.resetStore();
  }
}
