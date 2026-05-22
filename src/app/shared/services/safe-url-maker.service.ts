import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { getRuntimeAppConfig } from '@/app/shared/config/runtime-app-config';

@Injectable({
  providedIn: 'root'
})
export class SafeUrlMakerService {

  constructor(private sanitizer: DomSanitizer,) { }

  generateSafeUrl(url: string): SafeResourceUrl | null {
    const allowedOrigins = new Set(
      getRuntimeAppConfig()
        .allowedResourceOrigins
        .map(origin => origin.trim())
        .filter(Boolean)
    );

    try {
      const parsed = new URL(url);
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        return null;
      }

      if (parsed.username || parsed.password) {
        return null;
      }

      if (!allowedOrigins.has(parsed.origin)) {
        return null;
      }

      return this.sanitizer.bypassSecurityTrustResourceUrl(parsed.toString()); // nosemgrep
    } catch {
      return null;
    }
  }
}
