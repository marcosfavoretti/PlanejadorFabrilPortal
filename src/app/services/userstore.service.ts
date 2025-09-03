// services/userstore.service.ts
import { Injectable, effect, computed, signal } from '@angular/core';
import { User } from '../../api';
import { SignalStore } from '@/@core/abstract/SignalStore.abstract';

@Injectable({
  providedIn: 'root'
})
export class UserstoreService extends SignalStore<User> {
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

  updateUser(user: User) {
    console.log(user)
    this.set(user);
  }

  getUser(): User {
    console.log(this.get())
    return this.get()!;
  }

  clearUser() {
    this.clear();
  }

  // Computed para saber se está logado
  readonly isLoggedIn = computed(() => !!this.get());
}
