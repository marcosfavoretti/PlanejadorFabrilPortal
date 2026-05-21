import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';

@Component({
  selector: 'app-chatbot-shared-page',
  standalone: true,
  imports: [CommonModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />

    <section class="share-page">
      <div class="share-card">
        <i class="pi pi-share-alt share-icon"></i>
        <h1>Abrindo sua cópia</h1>

        @if (loading()) {
          <p>Estamos criando ou retomando sua conversa derivada.</p>
        } @else {
          <p>{{ errorMessage() }}</p>
          <button type="button" class="retry-btn" (click)="forkConversation()">
            Tentar novamente
          </button>
        }
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .share-page {
      min-height: 100%;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background:
        radial-gradient(circle at top, rgba(0, 167, 127, 0.12), transparent 35%),
        linear-gradient(180deg, #f8fafc 0%, #eef6f3 100%);
    }

    .share-card {
      width: min(100%, 30rem);
      padding: 2rem;
      text-align: center;
      border-radius: 1.5rem;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
    }

    .share-icon {
      font-size: 2.5rem;
      color: #00a77f;
      margin-bottom: 1rem;
    }

    h1 {
      margin: 0 0 0.75rem;
      font-size: 1.35rem;
      color: #0f172a;
    }

    p {
      margin: 0;
      color: #475569;
      line-height: 1.5;
    }

    .retry-btn {
      margin-top: 1rem;
      border: none;
      border-radius: 999px;
      padding: 0.75rem 1.1rem;
      background: #00a77f;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }
  `],
})
export class ChatbotSharedPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly estruturaApi = inject(EstruturaApiService);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(true);
  readonly errorMessage = signal('Não foi possível abrir esta conversa compartilhada.');

  ngOnInit(): void {
    this.forkConversation();
  }

  forkConversation(): void {
    const shareId = this.route.snapshot.paramMap.get('shareId')?.trim();
    if (!shareId) {
      this.loading.set(false);
      this.errorMessage.set('Link de compartilhamento inválido.');
      return;
    }

    this.loading.set(true);

    this.estruturaApi.forkSharedConversation(shareId).subscribe({
      next: (conversation) => {
        void this.router.navigate(['/estrutura/chatbot', conversation.sessionId], {
          replaceUrl: true,
        });
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Não foi possível criar sua cópia desta conversa.');
        this.messageService.add({
          severity: 'error',
          summary: 'Falha ao abrir conversa',
          detail: 'Tente novamente em alguns instantes.',
          life: 3000,
        });
      },
    });
  }
}
