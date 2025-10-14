import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, Signal, viewChild } from '@angular/core';
import { UserProfileAvatarComponent } from "../user-profile-avatar/user-profile-avatar.component";
import { UserstoreService } from '../../services/userstore.service';
import { PopoverModule } from 'primeng/popover';
import { UserDetailComponent } from "../user-detail/user-detail.component";
import { User, UserResponseDTO } from '../../../api';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { MinhasFabricasPopUpComponent } from '../minhas-fabricas-pop-up/minhas-fabricas-pop-up.component';
import { RouterModule } from '@angular/router';
import { GlobalFilterInputText } from '@/app/services/GlobalInputText.service';
import { debounceTime, Subject, takeUntil } from 'rxjs';

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