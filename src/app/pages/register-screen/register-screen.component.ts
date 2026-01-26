import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, filter, of, switchMap, take, tap, timer, Subject, takeUntil, finalize } from 'rxjs'; // Adicionei finalize
import { UserService } from '../../services/User.service';
import { LoadingPopupService } from '../../services/LoadingPopup.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-register-screen',
  imports: [InputTextModule, PasswordModule, FormsModule],
  templateUrl: './register-screen.component.html',
  styleUrl: './register-screen.component.css'
})
export class RegisterScreenComponent implements OnDestroy {
  userService = inject(UserService);
  router = inject(Router);
  popup = inject(LoadingPopupService);

  registerSuccessfull: boolean = false;
  
  private destroy$ = new Subject<void>(); 

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(forms: NgForm): void {
    if (forms.valid) {
      const { user, password, email } = forms.value;

      this.userService.register({ name: user, email, password })
        .pipe(
          catchError(err => {
            this.popup.showErrorMessage(err.response?.data?.error ?? 'Erro ao registrar usuário');
            return of(null);
          }),
          filter(res => res !== null), 
          switchMap(() => {
            this.registerSuccessfull = true;
            
            // Inicia o timer
            return timer(0, 10_000).pipe(
              // 1. LIMITADOR: Aceita apenas as primeiras 8 emissões do timer
              // Isso garante no máximo 8 tentativas de login
              take(8),

              switchMap(() => 
                this.userService.login({ user, password }).pipe(
                  catchError(() => of(null))
                )
              ),
              // Filtra apenas se o login der certo
              filter(loginResponse => loginResponse !== null),
              // Pega o primeiro sucesso e encerra
              take(1),
              // Se o usuário sair da tela, encerra
              takeUntil(this.destroy$),
              
              // Opcional: Executa quando o fluxo termina (seja por sucesso, 
              // por atingir as 8 tentativas ou pelo destroy)
              finalize(() => {
                 // Aqui você pode esconder um loading spinner se estiver usando um local
                 console.log('Polling finalizado (sucesso ou limite atingido)');
              })
            );
          }),
          tap(() => {
            // Se chegou aqui, é porque logou com sucesso dentro das 8 tentativas
            this.router.navigate(['/app']); 
          })
        )
        .subscribe(); 
    }
  }
}