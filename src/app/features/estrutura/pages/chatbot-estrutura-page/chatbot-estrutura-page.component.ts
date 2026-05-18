import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ChatbotWidgetComponent } from '@/app/features/estrutura/widgets/chatbot-widget/chatbot-widget.component';

@Component({
  selector: 'app-chatbot-estrutura-page',
  standalone: true,
  imports: [ChatbotWidgetComponent],
  template: `
    <app-chatbot-widget
      title="Chatbot Estrutura"
      subtitle="Tire dúvidas sobre a estrutura de produtos."
      headerIcon="pi-comments"
      inputPlaceholder="Escreva sua dúvida aqui..."
      [showHistory]="true"
      [sessionId]="sessionId()"
      [restoreHistory]="shouldRestoreHistory()"
    />
  `,
  styles: [`:host { display: block; height: 100%; }`],
})
export class ChatbotEstruturaPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly sessionId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('ssid') || undefined)),
  );
  readonly shouldRestoreHistory = computed(() => !!this.sessionId());
}
