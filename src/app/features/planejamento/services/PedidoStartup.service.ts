import { inject, Injectable } from '@angular/core';
import { forkJoin, switchMap } from 'rxjs';
import { IStartup } from '@/@core/abstract/IStartup';
import { IShutDown } from '@/@core/abstract/IShutDown';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { UserService } from '@/app/core/user/services/User.service';
import { PedidoPlanejadosStoreService } from './PedidoPlanejadoStore.service';
import { ContextoFabricaService } from './ContextoFabrica.service';
import { GanttStoreService } from './GanttStore.service';
import { PedidoStoreService } from './PedidoStore.service';
import { PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum } from '@/api/planejador';

@Injectable({
  providedIn: 'root',
})
export class PedidoStartUp implements IStartup, IShutDown {
  userService = inject(UserService);
  popUpService = inject(LoadingPopupService);
  userStore = inject(UserstoreService);
  fabricaStore = inject(ContextoFabricaService);
  pedidoPlenejadoStore = inject(PedidoPlanejadosStoreService);
  pedidoStoreService = inject(PedidoStoreService);
  ganttStore = inject(GanttStoreService);

  startup(): void {
    this.startUp();
  }

  startUp(): void {
    const flow$ = this.fabricaStore.initialize(undefined).pipe(
      switchMap(() =>
        forkJoin([
          this.pedidoPlenejadoStore.initialize(this.fabricaStore.item()?.fabricaId),
          this.pedidoStoreService.initialize(PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum.todos),
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
  }
}
