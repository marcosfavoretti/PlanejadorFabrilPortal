import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { SafeUrlMakerService } from '@/app/shared/services/safe-url-maker.service';
import { getRuntimeAppConfig } from '@/app/shared/config/runtime-app-config';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.css'
})
export class WelcomePageComponent {
  private readonly safeUrlMaker = inject(SafeUrlMakerService);
  protected readonly homeExternalUrl: SafeResourceUrl | null = this.safeUrlMaker.generateSafeUrl(
    getRuntimeAppConfig().homeExternalUrl
  );
}
