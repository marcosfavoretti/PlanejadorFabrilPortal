import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { RoutePermissionStoreService } from '@/app/services/RoutePermissionStore.service';
import { UserstoreService } from '@/app/services/userstore.service';
import { GlobalHeaderComponent } from '@/app/widgets/global-header/global-header.component';
import { SideBarComponent } from '@/app/widgets/side-bar/side-bar.component';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from "@angular/router";
import { SplitterModule } from 'primeng/splitter';
import { PageLayoutComponent } from "@/app/layouts/page-layout/page-layout.component";

@Component({
  selector: 'app-fabrica-principal-page',
  imports: [
    RouterOutlet,
    PageLayoutComponent
],
  templateUrl: './fabrica-principal-page.component.html',
  styleUrl: './fabrica-principal-page.component.css'
})
export class FabricaPrincipalPageComponent {
  popup = inject(LoadingPopupService);
  router = inject(Router);
  user = inject(UserstoreService);
  loadFinish: boolean = true;
  routerPermissionStore = inject(RoutePermissionStoreService);

}
