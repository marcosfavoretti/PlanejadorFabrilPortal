import { Injectable } from "@angular/core";
import { UserstoreService } from "./userstore.service";
import { UserService } from "./User.service";
import { LoadingPopupService } from "./LoadingPopup.service";
import { tap } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class HomeStartUpService {
    constructor(
        private userService: UserService,
        private userStore: UserstoreService,
        private popUpService: LoadingPopupService,
    ) { }

    startUp(): void {
        const userDetail$ = this.userService.detail()
            .pipe(
                tap((data) => this.userStore.updateUser(data))
            );
        this.popUpService.showWhile(userDetail$)
            .subscribe();
    }
}