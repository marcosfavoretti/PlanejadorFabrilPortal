import { Component, OnInit, Signal } from '@angular/core';
import { UserProfileAvatarComponent } from "../user-profile-avatar/user-profile-avatar.component";
import { UserstoreService } from '../../services/userstore.service';
import { PopoverModule } from 'primeng/popover';
import { UserDetailComponent } from "../user-detail/user-detail.component";
import { User } from '../../../api';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { MinhasFabricasPopUpComponent } from '../minhas-fabricas-pop-up/minhas-fabricas-pop-up.component';
import { RouterModule } from '@angular/router';

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
export class GlobalHeaderComponent implements OnInit {
  user!: Signal<User | null>;

  constructor(
    private userStore: UserstoreService,
    private popup: LoadingPopupService
  ) { }

  openMinhasFabricas(): void {
    this.popup.showPopUpComponent(MinhasFabricasPopUpComponent);
  }

  ngOnInit(): void {
    this.user = this.userStore.item;
  }
}
