import { Component, inject, OnInit, signal } from '@angular/core';
import { GlobalHeaderComponent } from "../../widgets/global-header/global-header.component";
import { SplitterModule } from 'primeng/splitter';
import { CommonModule } from '@angular/common';
import { SideBarComponent } from "@/app/widgets/side-bar/side-bar.component";
import { NavigationEnd, Router } from '@angular/router';
import { RoutePermissionStoreService } from '@/app/services/RoutePermissionStore.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [
    CommonModule,
    SplitterModule,
    GlobalHeaderComponent,
    SideBarComponent,
  ],
  templateUrl: './page-layout.component.html',
  styleUrls: ['./page-layout.component.css']
})
export class PageLayoutComponent implements OnInit {
  router = inject(Router);
  routerPermissionStore = inject(RoutePermissionStoreService);
  
  hasSubRoutes = signal(false);

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.processRoute(event.urlAfterRedirects);
      });

    this.processRoute(this.router.url);
  }

  private processRoute(currentUrl: string): void {
    const urlSegments = currentUrl.split('/').filter(segment => segment);
    if (urlSegments.length === 0) {
      this.hasSubRoutes.set(false);
      return;
    }

    const baseRoute = urlSegments[0];
    const routes = this.routerPermissionStore.item();
    if (!routes) {
      this.hasSubRoutes.set(false);
      return;
    };

    const foundRoute = routes.find(route => route.route === baseRoute);
    this.hasSubRoutes.set(!!foundRoute?.subRoutes && foundRoute.subRoutes.length > 0);
  }
}
