import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { catchError, concatMap, filter, of, switchMap, take, tap, timer, Subject, takeUntil, finalize } from 'rxjs';
import { UserService } from '../../services/User.service';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { UserstoreService } from '@/app/services/userstore.service';
import { RoutePermissionStoreService } from '@/app/services/RoutePermissionStore.service';

@Component({
  selector: 'app-register-screen',
  imports: [InputTextModule, PasswordModule, FormsModule],
  templateUrl: './register-screen.component.html',
  styleUrl: './register-screen.component.css'
})
export class RegisterScreenComponent implements OnInit, OnDestroy {
  userService = inject(UserService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  popup = inject(LoadingPopupService);
  userStore = inject(UserstoreService);
  routePermission = inject(RoutePermissionStoreService);

  registerSuccessfull: boolean = false;
  token: string | null = null;
  
  private destroy$ = new Subject<void>(); 

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(forms: NgForm): void {
    if (forms.valid) {
      const { user, password, email } = forms.value;

      const register$ = this.token
        ? this.userService.registerWithInvite({ name: user, email, password }, this.token)
        : this.userService.register({ name: user, email, password });

      register$
        .pipe(
          catchError(err => {
            const backendMessage = err.response?.data?.message;
            const errorTitle = Array.isArray(backendMessage) ? backendMessage[0] : (backendMessage || 'Erro ao registrar usuário');
            const errorDetail = err.response?.data?.error;
            
            this.popup.showErrorMessage(errorTitle, errorDetail);

            if (this.token && this.shouldRedirectInviteError(err)) {
              this.router.navigate(['/register']);
            }

            return of(null);
          }),
          filter(res => res !== null), 
          switchMap(() => {
            this.registerSuccessfull = true;
            
            return timer(0, 10_000).pipe(
              take(8),

              switchMap(() => 
                this.userService.login({ user, password }).pipe(
                  catchError(() => of(null))
                )
              ),
              filter(loginResponse => loginResponse !== null),
              take(1),
              concatMap(() => this.initializeSession()),
              takeUntil(this.destroy$),

              finalize(() => {
                console.log('Polling finalizado (sucesso ou limite atingido)');
              })
            );
          }),
          tap(() => {
            this.router.navigate(['/app']); 
          })
        )
        .subscribe(); 
    }
  }

  private shouldRedirectInviteError(err: any): boolean {
    const status = err?.response?.status;
    return status === 401 || status === 403 || status === 404;
  }

  private initializeSession() {
    this.userStore.resetStore();
    this.routePermission.resetStore();

    return this.userStore.initialize().pipe(
      concatMap(() => this.routePermission.initialize()),
      catchError((err) => {
        console.error('Failed to initialize session after register login', err);
        return of(null);
      })
    );
  }
}
