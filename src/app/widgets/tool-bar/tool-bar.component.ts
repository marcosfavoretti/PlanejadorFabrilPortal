import { ContagemBufferApiService } from '@/app/services/ContagemBufferApi.service';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { Component, inject } from '@angular/core';
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

  gotoDash(): void {
    this.router.navigate(['/dash']);
  }

  syncExcel(): void {
    const excel$ = this.api.exportExcel();
    this.popUp.showWhile(excel$);
  }
}
