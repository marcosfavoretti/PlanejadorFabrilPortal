import { AppSubRouteRes } from '@/api/routes';
import { routes } from '@/app/app.routes';
import { RoutePermissionStoreService } from '@/app/services/RoutePermissionStore.service';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-side-bar',
  imports: [CommonModule, RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css'
})
export class SideBarComponent
  implements OnInit {
  router = inject(Router);
  routerPermissionStore = inject(RoutePermissionStoreService);
  currentSubRoutes: AppSubRouteRes[] = [];

  actualRoutes = routes
  // Opcional: track do item ativo
  activeIndex = signal<number | null>(null);

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.processRoute(event.urlAfterRedirects);
      });

    // Process initial route
    this.processRoute(this.router.url);
  }

  private processRoute(currentUrl: string): void {
    const urlSegments = currentUrl.split('/').filter(segment => segment);
    if (urlSegments.length === 0) {
      this.currentSubRoutes = [];
      return;
    }

    const baseRoute = urlSegments[0];
    const routes = this.routerPermissionStore.item();
    if (!routes) return;

    const foundRoute = routes.find(route => route.route === baseRoute);
    this.currentSubRoutes = foundRoute?.subRoutes ?? [];
  }

  sidebarItemClickEvent(index: number) {
    this.activeIndex.set(index);
  }
}
