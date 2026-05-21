import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, concatMap, of, tap } from 'rxjs';
import { UserService } from '@/app/core/auth/services/user.service';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RoutePermissionStoreService } from '@/app/core/route-permission/stores/route-permission-store.service';
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
  private route = inject(ActivatedRoute);
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
          tap(() => {
            this.userStore.resetStore();
            this.routePermission.resetStore();
          }),
          concatMap(() =>
            this.userStore.initialize().pipe(
              concatMap(() => this.routePermission.initialize()),
              catchError((err) => {
                console.error('Failed to initialize routes', err);
                // Still navigate to app even if routes fail to load
                return of(null);
              })
            )
          ),
          tap(() => {
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
            if (returnUrl && returnUrl !== '/app' && returnUrl !== '/' && !returnUrl.includes('/login')) {
              this.router.navigateByUrl(returnUrl);
            } else {
              this.router.navigate(['/', 'app']);
            }
          })
        );
      this.popup.showWhile(login$);
    }
  }
}
