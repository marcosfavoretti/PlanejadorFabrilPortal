import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { SplitterModule } from 'primeng/splitter';
import { filter } from 'rxjs';
import { RoutePermissionStoreService } from '@/app/core/route-permission/stores/route-permission-store.service';
import { GlobalHeaderComponent } from '../../navigation/global-header/global-header.component';
import { SideBarComponent } from '../../navigation/side-bar/side-bar.component';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [
    CommonModule,
    SplitterModule,
    SidebarModule,
    ButtonModule,
    GlobalHeaderComponent,
    SideBarComponent,
  ],
  templateUrl: './page-layout.component.html',
  styleUrls: ['./page-layout.component.css']
})
export class PageLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly routerPermissionStore = inject(RoutePermissionStoreService);

  protected readonly urlSignal = signal(this.router.url);
  protected readonly sidebarVisible = signal(false);
  protected readonly isMobile = signal(window.innerWidth < 992);

  protected readonly hasSubRoutes = computed(() => {
    const urlSegments = this.urlSignal().split('/').filter(Boolean);
    if (urlSegments.length === 0) {
      return false;
    }

    const baseRoute = urlSegments[0];
    const routes = this.routerPermissionStore.item();
    if (!Array.isArray(routes)) {
      return false;
    }

    const foundRoute = routes.find(route => route.route === baseRoute);
    return !!foundRoute?.subRoutes?.length;
  });

  ngOnInit(): void {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 992);
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.urlSignal.set(event.urlAfterRedirects);
      });
  }

  protected openSidebar() {
    this.sidebarVisible.set(true);
  }

  protected closeSidebar() {
    this.sidebarVisible.set(false);
  }
}
