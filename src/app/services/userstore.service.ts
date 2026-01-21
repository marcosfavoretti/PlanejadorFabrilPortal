// services/userstore.service.ts
import { Injectable, effect, computed, signal, inject } from '@angular/core';
import { SignalStore } from '@/@core/abstract/SignalStore.abstract';
import { catchError, Observable, of, tap } from 'rxjs';
import { UserService } from './User.service';
import { UserResponseDTO } from '@/api/auth';

@Injectable({
  providedIn: 'root'
})
export class UserstoreService
  extends SignalStore<UserResponseDTO> {

  userService = inject(UserService);

  constructor() {
    super();
    // Exemplo de log automático quando o user muda
    effect(() => {
      const user = this.item();
      if (user) {
        console.log('[UserstoreService] Usuário atualizado:', user.name);
      }
    });
  }

  override refresh(): Observable<UserResponseDTO> {
    return this.userService.detail()
      .pipe(
        tap(
          user => this.set(user)
        ),
        catchError(
          () => {
            this.initialized = false;
            throw new Error('Erro ao autenticar usuario');
          }
        )
      );
  }

  updateUser(user: UserResponseDTO) {
    console.log(user)
    this.set(user);
  }

  getUser(): UserResponseDTO {
    console.log(this.get())
    return this.get()!;
  }

  clearUser() {
    this.clear();
  }

  // Computed para saber se está logado
  readonly isLoggedIn = computed(() => !!this.get());
}
