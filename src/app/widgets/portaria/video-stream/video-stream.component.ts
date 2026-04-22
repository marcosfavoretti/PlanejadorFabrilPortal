import { Component, ElementRef, OnInit, ViewChild, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortariaStoreService, VeiculoDTO } from '@/app/services/PortariaStore.service';
import { SkeletonModule } from 'primeng/skeleton';
import { Subscription } from 'rxjs';

import Hls from 'hls.js';

@Component({
  selector: 'app-video-stream',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  templateUrl: './video-stream.component.html',
  styleUrl: './video-stream.component.css'
})
export class VideoStreamComponent implements OnInit, OnDestroy {
  private portariaStore = inject(PortariaStoreService);

  @ViewChild('videoPlayer', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;

  hls: any;
  manifestUrl = signal<string | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  showPlayButton = signal(false);
  lastDetected = signal<VeiculoDTO | null>(null);
  now = new Date();
  private timer: any;
  private wsSubscription?: Subscription;
  private sessionSubscription?: Subscription;
  private initializePlayerTimeout?: ReturnType<typeof setTimeout>;
  private nativeLoadedMetadataHandler?: () => void;
  private isDestroyed = false;

  constructor() {
  }

  ngOnInit() {
    this.isDestroyed = false;
    this.loadSession();
    this.timer = setInterval(() => {
      this.now = new Date();
    }, 100);

    this.wsSubscription = this.portariaStore.lastDetectedVehicle$.subscribe((v: VeiculoDTO) => {
      this.lastDetected.set(v);
    });
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.timer) clearInterval(this.timer);
    this.wsSubscription?.unsubscribe();
    this.sessionSubscription?.unsubscribe();
    if (this.initializePlayerTimeout) clearTimeout(this.initializePlayerTimeout);
    this.destroyPlayer();
  }

  private destroyPlayer() {
    if (this.hls) {
      this.hls.stopLoad();
      this.hls.destroy();
      this.hls = undefined;
    }

    const video = this.videoElement?.nativeElement;
    if (video) {
      if (this.nativeLoadedMetadataHandler) {
        video.removeEventListener('loadedmetadata', this.nativeLoadedMetadataHandler);
        this.nativeLoadedMetadataHandler = undefined;
      }

      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }

  loadSession() {
    if (this.isDestroyed) return;

    this.isLoading.set(true);
    this.sessionSubscription?.unsubscribe();
    this.sessionSubscription = this.portariaStore.getVideoSession().subscribe({
      next: (res) => {
        if (this.isDestroyed) return;

        if (res.manifestUrl) {
          this.manifestUrl.set(res.manifestUrl);
          if (this.initializePlayerTimeout) clearTimeout(this.initializePlayerTimeout);
          this.initializePlayerTimeout = setTimeout(() => this.initializePlayer(res.manifestUrl), 100);
        } else {
          this.error.set('URL do manifesto não disponível');
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        if (this.isDestroyed) return;

        this.error.set('Erro ao autenticar sessão de vídeo');
        this.isLoading.set(false);
      }
    });
  }

  initializePlayer(url: string) {
    if (this.isDestroyed) return;

    const video = this.videoElement.nativeElement;
    video.muted = true; // Evitar bloqueio garantindo muted explicitamente no DOM
    this.showPlayButton.set(false);
    
    this.destroyPlayer();

    if (Hls.isSupported()) {
      this.hls = new Hls({
        xhrSetup: (xhr: XMLHttpRequest, url: string) => {
          xhr.withCredentials = true;
        },
        fetchSetup: (context: any, init: any) => {
          init.credentials = 'include';
          return new Request(context.url, init);
        },
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60
      });

      this.hls.loadSource(url);
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (this.isDestroyed) return;

        this.isLoading.set(false);
        video.play().catch(e => {
          console.warn('Autoplay blocked', e);
          this.showPlayButton.set(true);
        });
      });

      this.hls.on(Hls.Events.ERROR, (event: any, data: any) => {
        if (this.isDestroyed) return;

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.response?.code === 401) {
                this.loadSession();
              } else {
                this.hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.hls.recoverMediaError();
              break;
            default:
              this.error.set('Erro fatal no player de vídeo');
              this.destroyPlayer();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      this.nativeLoadedMetadataHandler = () => {
        if (this.isDestroyed) return;

        this.isLoading.set(false);
        video.play().catch(e => {
          console.warn('Autoplay blocked native', e);
          this.showPlayButton.set(true);
        });
      };
      video.addEventListener('loadedmetadata', this.nativeLoadedMetadataHandler);
    } else {
      this.error.set('Seu navegador não suporta HLS.');
      this.isLoading.set(false);
    }
  }

  retry() {
    if (this.isDestroyed) return;

    this.error.set(null);
    this.loadSession();
  }

  forcePlay() {
    const video = this.videoElement.nativeElement;
    video.muted = true; // Força mute via interacao do usuario para garantir
    video.play().then(() => {
      this.showPlayButton.set(false);
    }).catch(e => console.error('Erro ao forçar play:', e));
  }

  toggleFullscreen() {
    const video = this.videoElement.nativeElement;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen();
    } else if ((video as any).msRequestFullscreen) {
      (video as any).msRequestFullscreen();
    }
  }
}
