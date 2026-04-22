import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../services/User.service';

@Injectable({
  providedIn: 'root'
})
export class RegisterTokenGuard implements CanActivate {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    const token = route.paramMap.get('token');

    if (!token) {
      return this.router.createUrlTree(['/register']);
    }

    try {
      await firstValueFrom(this.userService.validateRegisterToken(token));
      return true;
    } catch (error) {
      console.error('Token de cadastro invalido:', error);
      return this.router.createUrlTree(['/register']);
    }
  }
}
