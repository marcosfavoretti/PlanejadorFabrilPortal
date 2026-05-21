import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService } from '@/app/core/auth/services/user.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  userService = inject(UserService);
  router = inject(Router);

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    try {
      const ping$ = this.userService.ping();
      await firstValueFrom(ping$);
      return true;
    } catch (error) {
      console.error('Error occurred during authentication check:', error);
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  }
}
