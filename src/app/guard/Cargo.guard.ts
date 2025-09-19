import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { UserstoreService } from "../services/userstore.service";

@Injectable({ providedIn: 'root' })
export class CargoGuard implements CanActivate {
    constructor(private user: UserstoreService, private router: Router) { }

    canActivate(route: any): boolean {
        const allowedRoles = route.data?.['roles'] as string[];
        const userRoles = this.user.item()?.cargosList;
        console.log(allowedRoles, this.user.item())
        if (!userRoles || !userRoles.length) this.redirect();
        if (!allowedRoles || allowedRoles.some(r => userRoles!.includes(r))) {
            return true;
        }
        this.router.navigate(['/'])
        return false;
    }

    private redirect() {
        this.router.navigate(['/login']);//TODO mudar para um rota de falha de cargo
    }
}
