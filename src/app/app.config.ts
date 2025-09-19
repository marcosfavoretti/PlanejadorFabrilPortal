import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';
import { MessageService } from 'primeng/api';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { UserstoreService } from './services/userstore.service';
import { catchError, firstValueFrom, of } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(async () => {
      const userStore = inject(UserstoreService);
      try {
        await firstValueFrom(
          userStore.initialize()
            .pipe(
              catchError(err => {
                console.error('Falha ao inicializar usuário', err);
                return of(null);
              })
            ));
      } catch (err) {
        console.error('Usuario não logado', err);
      }
    }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled'
    })),
    provideAnimationsAsync(),
    MessageService,
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
};
