import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { Router, RouterOutlet } from '@angular/router';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { RoutePermissionStoreService } from '@/app/core/route-permission/stores/route-permission-store.service';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    PageLayoutComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent {

  popup = inject(LoadingPopupService);
  router = inject(Router);
  user = inject(UserstoreService);
  routerPermissionStore = inject(RoutePermissionStoreService);
}
