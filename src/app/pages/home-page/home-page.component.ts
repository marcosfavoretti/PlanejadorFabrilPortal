import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { Router, RouterOutlet } from '@angular/router';
import { UserstoreService } from '@/app/services/userstore.service';
import { RoutePermissionStoreService } from '@/app/services/RoutePermissionStore.service';
import { IShutDown } from '@/@core/abstract/IShutDown';
import { IStartUp } from '@/@core/abstract/IStartUp';
import { HomeStartUpService } from '@/app/services/HomeStartup.service';
import { PageLayoutComponent } from '@/app/layouts/page-layout/page-layout.component';

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

  homeStartUpService: IShutDown & IStartUp = inject(HomeStartUpService);

  ngOnInit(): void {
    this.homeStartUpService.startUp();
  }

  ngOnDestroy(): void {
    this.homeStartUpService.shutDown();
  }
}
