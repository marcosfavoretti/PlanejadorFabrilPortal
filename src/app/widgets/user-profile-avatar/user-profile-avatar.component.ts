import { Component, inject, Injectable, Input, OnInit, Signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from "primeng/avatar";
import { UserstoreService } from '../../services/userstore.service';
import { User, UserResponseDTO } from '@/api';

@Component({
  selector: 'app-user-profile-avatar',
  imports: [AvatarModule, TooltipModule],
  templateUrl: './user-profile-avatar.component.html',
  styleUrls: ['./user-profile-avatar.component.css'],
})
export class UserProfileAvatarComponent implements OnInit {
  @Input() avatarLetter?: string;
  @Input() selfProfile = false;
  @Input() size: "normal" | 'large' | 'xlarge' = 'normal';

  userStore = inject(UserstoreService);
  user!: Signal<UserResponseDTO | null>;

  ngOnInit(): void {
    this.user = this.userStore.item;
  }

  // Se quiser, crie um getter para a letra do usuário atual
  get userAvatarLetter(): string {
    if (this.selfProfile && this.user()) {
      return this.user()!.name?.charAt(0).toUpperCase() || '?';
    }
    return this.avatarLetter || '?';
  }
}
