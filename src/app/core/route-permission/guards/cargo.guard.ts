import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserstoreService } from '../../user/stores/user-store.service';

@Injectable({
  providedIn: 'root'
})
export class CargoGuard implements CanActivate {
  constructor(
    private readonly user: UserstoreService,
    private readonly router: Router
  ) {}

  canActivate(route: any): boolean {
    const allowedRoles = route.data?.['roles'] as string[] | undefined;
    const userRoles = this.user.item()?.cargosLista;

    if (!userRoles || userRoles.length === 0) {
      this.redirect();
      return false;
    }

    if (!allowedRoles || allowedRoles.some(role => userRoles.includes(role))) {
      return true;
    }

    void this.router.navigate(['/']);
    return false;
  }

  private redirect() {
    console.error('Usuario sem cargo autorizado');
    void this.router.navigate(['/login']);
  }
}
