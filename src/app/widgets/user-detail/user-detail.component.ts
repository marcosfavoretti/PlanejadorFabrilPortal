import { Component, inject, OnInit, Signal } from '@angular/core';
import { UserService } from '../../services/User.service';
import { Router, RouterModule } from '@angular/router';
import { tap } from 'rxjs';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { UserstoreService } from '../../services/userstore.service';
import {  TagModule } from 'primeng/tag';
import { UserResponseDTO } from '@/api/auth';
import { RoutePermissionStoreService } from '@/app/services/RoutePermissionStore.service';

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
  private popUpService = inject(LoadingPopupService);
  private userStore = inject(UserstoreService);
  private routerStore = inject(RoutePermissionStoreService);
  private userService = inject(UserService);
  private router = inject(Router);
  user !: Signal<UserResponseDTO | null>;
  loadFinish: boolean = false;

  logout(): void {
    const logout$ = this.userService.logout()
      .pipe(
        tap(() => {
          this.router.navigate(['/login']);
          this.userStore.resetStore();
          this.routerStore.resetStore();
        })
      )
    this.popUpService.showWhile(logout$);
  }

  ngOnInit(): void {
    this.user = this.userStore.item;
    this.loadFinish = true;
  }
}
