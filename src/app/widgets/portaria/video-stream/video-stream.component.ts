import { Component, ElementRef, OnInit, ViewChild, inject, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortariaStoreService, VeiculoDTO } from '@/app/services/PortariaStore.service';
import { SkeletonModule } from 'primeng/skeleton';

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
  private wsSubscription: any;

  constructor() {
  }

  ngOnInit() {
    this.loadSession();
    this.timer = setInterval(() => {
      this.now = new Date();
    }, 100);

    this.wsSubscription = this.portariaStore.lastDetectedVehicle$.subscribe((v: VeiculoDTO) => {
      this.lastDetected.set(v);
    });
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.wsSubscription) this.wsSubscription.unsubscribe();
    if (this.hls) {
      this.hls.destroy();
    }
  }

  loadSession() {
    this.isLoading.set(true);
    this.portariaStore.getVideoSession().subscribe({
      next: (res) => {
        if (res.manifestUrl) {
          this.manifestUrl.set(res.manifestUrl);
          setTimeout(() => this.initializePlayer(res.manifestUrl), 100);
        } else {
          this.error.set('URL do manifesto não disponível');
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        this.error.set('Erro ao autenticar sessão de vídeo');
        this.isLoading.set(false);
      }
    });
  }

  initializePlayer(url: string) {
    const video = this.videoElement.nativeElement;
    video.muted = true; // Evitar bloqueio garantindo muted explicitamente no DOM
    this.showPlayButton.set(false);
    
    if (this.hls) {
      this.hls.destroy();
    }

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
        this.isLoading.set(false);
        video.play().catch(e => {
          console.warn('Autoplay blocked', e);
          this.showPlayButton.set(true);
        });
      });

      this.hls.on(Hls.Events.ERROR, (event: any, data: any) => {
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
              this.hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        this.isLoading.set(false);
        video.play().catch(e => {
          console.warn('Autoplay blocked native', e);
          this.showPlayButton.set(true);
        });
      });
    } else {
      this.error.set('Seu navegador não suporta HLS.');
      this.isLoading.set(false);
    }
  }

  retry() {
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
