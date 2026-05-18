import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router";
import { UserstoreService } from '@/app/core/user/stores/user-store.service';

@Injectable({ providedIn: 'root' })
export class CargoGuard implements CanActivate {
    constructor(private user: UserstoreService, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot): boolean {
        const allowedRoles = route.data?.['roles'] as string[];
        const userRoles = this.user.item()?.cargosLista;

        if (!userRoles || !userRoles.length) {
            this.redirect();
            return false;
        }

        if (!allowedRoles || allowedRoles.length === 0) {
            return true;
        }

        if (allowedRoles.some(role => userRoles.includes(role))) {
            return true;
        }

        this.router.navigate(['/']);
        return false;
    }

    private redirect(): void {
        console.error('Usuario sem cargo autorizado');
        this.router.navigate(['/login']);//TODO mudar para um rota de falha de cargo
    }
}
