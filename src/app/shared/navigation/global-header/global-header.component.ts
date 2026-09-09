import { UserResponseDTO } from '@/api/auth';
import { NavigationRoute, RoutePermissionStoreService } from '@/app/core/route-permission/stores/route-permission-store.service';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { AfterViewInit, Component, ElementRef, computed, inject, OnDestroy, OnInit, Signal, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PopoverModule } from 'primeng/popover';
import { UserProfileAvatarComponent } from '../../components/user-profile-avatar/user-profile-avatar.component';
import { UserDetailComponent } from '../user-detail/user-detail.component';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';

type NavigationRouteGroup = {
  tag: string;
  routes: NavigationRoute[];
};

@Component({
  selector: 'global-header',
  imports: [
    UserProfileAvatarComponent,
    RouterModule,
    PopoverModule,
    UserDetailComponent
  ],
  templateUrl: './global-header.component.html',
  styleUrl: './global-header.component.css'
})
export class GlobalHeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  protected user!: Signal<UserResponseDTO | null>;
  protected readonly userStore = inject(UserstoreService);
  protected readonly routerPermission = inject(RoutePermissionStoreService);
  protected readonly popup = inject(LoadingPopupService);
  protected readonly navigationRoutes = computed(() => {
    const routes = this.routerPermission.item();
    return Array.isArray(routes) ? routes : [];
  });
  protected readonly untaggedNavigationRoutes = computed(() =>
    this.navigationRoutes().filter(route => !route.tag)
  );
  protected readonly taggedNavigationRoutes = computed<NavigationRouteGroup[]>(() => {
    const groups = new Map<string, NavigationRoute[]>();

    for (const route of this.navigationRoutes()) {
      if (!route.tag) {
        continue;
      }

      const group = groups.get(route.tag) ?? [];
      group.push(route);
      groups.set(route.tag, group);
    }

    return Array.from(groups, ([tag, routes]) => ({ tag, routes }));
  });

  private resizeObserver?: ResizeObserver;
  readonly globalHeaderRef = viewChild.required<ElementRef>('globalHeader');

  ngAfterViewInit(): void {
    const el: HTMLElement = this.globalHeaderRef().nativeElement;
    const updateVar = () => {
      document.documentElement.style.setProperty('--navbar-height', `${el.offsetHeight}px`);
    };

    updateVar();
    this.resizeObserver = new ResizeObserver(updateVar);
    this.resizeObserver.observe(el);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  protected breakRoute(route: string): string[] {
    return ['/', ...route.split('/').filter(part => part !== '')];
  }

  protected formatTag(tag: string): string {
    return tag
      .trim()
      .toLocaleLowerCase('pt-BR')
      .replace(/[-_]+/g, ' ')
      .replace(/(^|\s)(\p{L})/gu, (_, prefix: string, character: string) =>
        `${prefix}${character.toLocaleUpperCase('pt-BR')}`
      );
  }

  ngOnInit(): void {
    this.user = this.userStore.item;
  }
}
