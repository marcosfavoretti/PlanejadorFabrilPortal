import { UserResponseDTO } from '@/api/auth';
import { RoutePermissionStoreService } from '@/app/core/route-permission/stores/route-permission-store.service';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, Signal, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PopoverModule } from 'primeng/popover';
import { UserProfileAvatarComponent } from '../../components/user-profile-avatar/user-profile-avatar.component';
import { UserDetailComponent } from '../user-detail/user-detail.component';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';

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

  ngOnInit(): void {
    this.user = this.userStore.item;
  }
}
