import { SignalStore } from '@/@core/abstract/SignalStore.abstract';
import { UserResponseDTO } from '@/api/auth';
import { computed, effect, inject, Injectable } from '@angular/core';
import { catchError, Observable, tap } from 'rxjs';
import { UserService } from '../../auth/services/user.service';

@Injectable({
  providedIn: 'root'
})
export class UserstoreService extends SignalStore<UserResponseDTO> {
  private readonly userService = inject(UserService);

  constructor() {
    super();

    effect(() => {
      const user = this.item();
      if (user) {
        console.log('[UserstoreService] Usuário atualizado:', user.name);
      }
    });
  }

  override refresh(): Observable<UserResponseDTO> {
    return this.userService.detail().pipe(
      tap(user => this.set(user)),
      catchError(() => {
        this.clear();
        this.initialized = false;
        throw new Error('Erro ao autenticar usuario');
      })
    );
  }

  updateUser(user: UserResponseDTO) {
    this.set(user);
  }

  getUser(): UserResponseDTO {
    return this.get()!;
  }

  clearUser() {
    this.clear();
  }

  readonly isLoggedIn = computed(() => !!this.get());
}
