import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, Signal, viewChild } from '@angular/core';
import { UserProfileAvatarComponent } from "../user-profile-avatar/user-profile-avatar.component";
import { UserstoreService } from '../../services/userstore.service';
import { PopoverModule } from 'primeng/popover';
import { UserDetailComponent } from "../user-detail/user-detail.component";
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { RouterModule } from '@angular/router';
import { GlobalFilterInputText } from '@/app/services/GlobalInputText.service';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { UserResponseDTO } from '@/api/auth';
import { RoutePermissionStoreService } from '@/app/services/RoutePermissionStore.service';

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
export class GlobalHeaderComponent implements OnInit, OnDestroy {
  user!: Signal<UserResponseDTO | null>;
  userStore = inject(UserstoreService);
  routerPermission = inject(RoutePermissionStoreService);
  popup = inject(LoadingPopupService);
  globalFilter = inject(GlobalFilterInputText);

  private destroy$ = new Subject<void>();
  private input$ = new Subject<string>();

  setGlobalFilter(text: string) {
    this.globalFilter.setText(text);
  }

  onInputChange(ev: EventTarget | null) {
    const { value } = (ev as HTMLInputElement)
    this.input$.next(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.user = this.userStore.item;
    this.input$
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe(text => { this.globalFilter.setText(text)});
  }
}