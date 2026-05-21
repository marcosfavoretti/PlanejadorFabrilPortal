import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { RoutePermissionStoreService } from '@/app/core/route-permission/stores/route-permission-store.service';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css'
})
export class SideBarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly routerPermissionStore = inject(RoutePermissionStoreService);

  protected readonly urlSignal = signal(this.router.url);
  protected readonly currentBaseRoute = computed(() => {
    const urlSegments = this.urlSignal().split('/').filter(Boolean);
    return urlSegments.length > 0 ? urlSegments[0] : '';
  });

  protected readonly currentSubRoutes = computed(() => {
    const baseRoute = this.currentBaseRoute();
    if (!baseRoute) {
      return [];
    }

    const routes = this.routerPermissionStore.item();
    if (!Array.isArray(routes)) {
      return [];
    }

    const foundRoute = routes.find(route => route.route === baseRoute);
    return foundRoute?.subRoutes ?? [];
  });

  @Output() onItemClick = new EventEmitter<void>();

  protected readonly activeIndex = signal<number | null>(null);

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.urlSignal.set(event.urlAfterRedirects);
      });
  }

  protected buildRouteLink(route: string): string[] {
    return ['/', this.currentBaseRoute(), ...route.split('/').filter(Boolean)];
  }

  protected sidebarItemClickEvent(index: number) {
    this.activeIndex.set(index);
    this.onItemClick.emit();
  }
}
