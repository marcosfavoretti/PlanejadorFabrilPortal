import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';
import { MessageService } from 'primeng/api';
import { platformBrowser } from '@angular/platform-browser';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes, withInMemoryScrolling({
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
