import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { getRuntimeAppConfig } from '@/app/shared/config/runtime-app-config';

@Injectable({
  providedIn: 'root'
})
export class SafeUrlMakerService {

  constructor(private sanitizer: DomSanitizer,) { }

  generateSafeUrl(url: string): SafeResourceUrl | null {
    const allowedOrigins = getRuntimeAppConfig().allowedResourceOrigins;

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return null;
      }

      if (!allowedOrigins.includes(parsed.origin)) {
        return null;
      }

      return this.sanitizer.bypassSecurityTrustResourceUrl(parsed.toString());
    } catch {
      return null;
    }
  }
}
