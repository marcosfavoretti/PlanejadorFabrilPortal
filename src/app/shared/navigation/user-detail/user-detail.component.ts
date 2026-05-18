import { UserResponseDTO } from '@/api/auth';
import { UserService } from '@/app/core/auth/services/user.service';
import { RoutePermissionStoreService } from '@/app/core/route-permission/stores/route-permission-store.service';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { Component, inject, OnInit, output, Signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { tap } from 'rxjs';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-user-detail',
  imports: [
    TagModule,
    RouterModule
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css'
})
export class UserDetailComponent implements OnInit {
  private readonly popUpService = inject(LoadingPopupService);
  private readonly userStore = inject(UserstoreService);
  private readonly routerStore = inject(RoutePermissionStoreService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  protected user!: Signal<UserResponseDTO | null>;
  protected loadFinish = false;
  readonly onClose = output<void>();

  protected logout(): void {
    const logout$ = this.userService.logout().pipe(
      tap(() => {
        this.userStore.resetStore();
        this.routerStore.resetStore();
        this.login();
      })
    );

    this.popUpService.showWhile(logout$);
  }

  protected login(): void {
    void this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.user = this.userStore.item;
    this.loadFinish = true;
  }
}
