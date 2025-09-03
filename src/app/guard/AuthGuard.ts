import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from '../services/User.service';
import { firstValueFrom, tap } from 'rxjs';
import { LoadingPopupService } from '../services/LoadingPopup.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private userService: UserService, private popup: LoadingPopupService) { }

  async canActivate(): Promise<boolean> {
    try {
      const ping$ = this.userService.ping();
      this.popup.showWhile(ping$);
      await firstValueFrom(ping$);
      return true;
    } catch (error) {
      console.error('Error occurred during authentication check:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
