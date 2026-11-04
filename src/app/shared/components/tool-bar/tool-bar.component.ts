import { ContagemBufferApiService } from '@/app/features/buffer/services/ContagemBufferApi.service';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SetorStoreService } from '@/app/features/buffer/services/SetorStore.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-tool-bar',
  imports: [TooltipModule, ButtonModule],
  templateUrl: './tool-bar.component.html',
  styleUrl: './tool-bar.component.css'
})
export class ToolBarComponent {
  private router = inject(Router);
  private popUp = inject(LoadingPopupService);
  private api = inject(ContagemBufferApiService)
  readonly setor = toSignal(inject(SetorStoreService).currentSetor$, { initialValue: null });
  readonly hoje = new Date().toLocaleDateString('pt-BR');

  gotoDash(): void {
    this.router.navigate(['/dash']);
  }

  syncExcel(): void {
    const excel$ = this.api.exportExcel();
    this.popUp.showWhile(excel$);
  }
}
