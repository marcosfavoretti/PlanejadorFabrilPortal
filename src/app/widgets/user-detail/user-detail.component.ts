import { Component, OnInit, Signal } from '@angular/core';
import { UserService } from '../../services/User.service';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { User, UserResponseDTO } from '../../../api';
import { UserstoreService } from '../../services/userstore.service';
import { Tag, TagModule } from 'primeng/tag';

@Component({
  selector: 'app-user-detail',
  imports: [
    TagModule
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css'
})
export class UserDetailComponent implements OnInit {
  constructor(
    private popUpService: LoadingPopupService,
    private userStore: UserstoreService,
    private userService: UserService,
    private router: Router
  ) { }
  user !: Signal<UserResponseDTO | null>;
  loadFinish: boolean = false;

  logout(): void {
    const logout$ = this.userService.logout()
      .pipe(
        tap(() => {
          this.router.navigate(['/login']);
          this.userStore.resetStore();
        })
      )
    this.popUpService.showWhile(logout$);
  }

  ngOnInit(): void {
    this.user = this.userStore.item;
    this.loadFinish = true;
  }
}
