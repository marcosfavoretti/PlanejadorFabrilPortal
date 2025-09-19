import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from '../services/User.service';
import { firstValueFrom, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  userService = inject(UserService);
  router = inject(Router);

  async canActivate(): Promise<boolean> {
    try {
      const ping$ = this.userService
        .ping();
      await firstValueFrom(ping$);
      console.log('voltoou tru')
      return true;
    } catch (error) {
      console.error('Error occurred during authentication check:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
