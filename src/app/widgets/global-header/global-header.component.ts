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
export class GlobalHeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  user!: Signal<UserResponseDTO | null>;
  userStore = inject(UserstoreService);
  popup = inject(LoadingPopupService);
  globalHeaderHtml = viewChild<ElementRef>('globalHeader');
  globalFilter = inject(GlobalFilterInputText);

  ngAfterViewInit() {
    const el = this.globalHeaderHtml()?.nativeElement;
    if (el) {
      const observer = new ResizeObserver(() => this.resizeHeader());
      observer.observe(el);
      this.destroy$.subscribe(() => observer.disconnect());
    }
    else {
      document.body.style.paddingTop = `0px`;
    }
    this.resizeHeader();
  }

  resizeHeader() {
    const headerHeight = this.globalHeaderHtml()?.nativeElement.clientHeight || 0;
    document.body.style.paddingTop = `${headerHeight}px`;
  }

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
      .subscribe(text => { this.globalFilter.setText(text); this.resizeHeader() });
  }
}
