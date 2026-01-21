import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap, tap } from 'rxjs';
import { UserService } from '../../services/User.service';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { UserstoreService } from '@/app/services/userstore.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RoutePermissionStoreService } from '@/app/services/RoutePermissionStore.service';
@Component({
  selector: 'app-login-screen',
  standalone: true,
  imports: [FormsModule, InputTextModule, PasswordModule,],
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.css']
})
export class LoginScreenComponent {

  private userService = inject(UserService);
  private router = inject(Router);
  private routePermission = inject(RoutePermissionStoreService);
  private userStore = inject(UserstoreService);
  private popup = inject(LoadingPopupService);

  onSubmit(forms: NgForm): void {
    if (forms.valid) {
      const user = forms.controls['user'].value;
      const password = forms.controls['password'].value;
      const login$ = this.userService
        .login({ user, password })
        .pipe(
          switchMap(() =>
            this.userStore.initialize()
              .pipe(
                finalize(() => {
                  this.routePermission.initialize()
                  .subscribe();
                  this.router.navigate(['/', 'app'])
                })
              )
          ),

        );
      this.popup.showWhile(login$);
    }
  }
}
