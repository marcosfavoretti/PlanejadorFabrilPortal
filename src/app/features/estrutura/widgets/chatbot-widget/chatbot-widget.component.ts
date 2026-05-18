import {
  Component,
  inject,
  computed,
  effect,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  AfterViewInit,
  OnInit,
  OnDestroy,
  Input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatbotService, ConversationSummary } from '@/app/features/estrutura/services/chatbot.service';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { MarkdownPipe } from '@/@core/pipes/markdown.pipe';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ImageModule } from 'primeng/image';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe, ToastModule, ImageModule],
  providers: [MessageService, ChatbotService],
  templateUrl: './chatbot-widget.component.html',
  styleUrls: ['./chatbot-widget.component.css'],
})
export class ChatbotWidgetComponent implements OnInit, AfterViewChecked, AfterViewInit, OnDestroy {
  // ── Inputs ─────────────────────────────────────────────────────────────────
  /** Título exibido no cabeçalho do chat */
  @Input() title = 'Chatbot';
  /** Subtítulo / descrição exibida abaixo do título */
  @Input() subtitle = 'Como posso ajudar hoje?';
  /** Ícone PrimeNG usado no cabeçalho */
  @Input() headerIcon = 'pi-comments';
  /** Placeholder do campo de texto */
  @Input() inputPlaceholder = 'Escreva sua dúvida aqui...';
  /** Se true, exibe o painel lateral de histórico de conversas */
  @Input() showHistory = true;
  /** Se true, restaura o histórico da sessão atual ao iniciar */
  @Input() restoreHistory = false;
  /** SessionId inicial (opcional) — para retomar uma conversa existente */
  @Input() sessionId?: string;

  // Contexto da sessão — enviado ao backend ao criar nova conversa
  @Input() contextType = 'default';
  @Input() chatTitle?: string;

  // ── Injeções ────────────────────────────────────────────────────────────────
  readonly chatbotService = inject(ChatbotService);
  private readonly router = inject(Router);
  private readonly estruturaApi = inject(EstruturaApiService);
  private readonly userStore = inject(UserstoreService);
  private readonly messageService = inject(MessageService);

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('messageInput') private messageInput!: ElementRef<HTMLInputElement>;

  // ── Estado do componente ────────────────────────────────────────────────────
  readonly messages = this.chatbotService.messages;
  readonly loading = this.chatbotService.loading;
  readonly canCancel = this.chatbotService.canCancel;
  readonly historyLoading = this.chatbotService.historyLoading;
  readonly sessionCreating = this.chatbotService.sessionCreating;

  /** Título computado: usa o nome da conversa se disponível, senão o título padrão */
  readonly computedTitle = computed(() => this.chatbotService.activeTitle() || this.title);

  /** Input desabilitado quando: enviando msg, carregando histórico ou criando sessão */
  readonly inputDisabled = computed(
    () => this.loading() || this.historyLoading() || this.sessionCreating(),
  );
  readonly showTypingIndicator = computed(() => this.loading());

  newMessage = '';
  editableTitle = '';
  readonly renaming = signal(false);
  readonly renameSaving = signal(false);
  private shouldScroll = false;
  private historyNavIndex = -1;
  private currentDraft = '';

  // Sidebar de histórico
  sidebarOpen = true;
  conversations = signal<ConversationSummary[]>([]);
  conversationsLoading = signal(false);
  pendingDeleteConversationId = signal<string | null>(null);
  deletingConversationId = signal<string | null>(null);

  private subscriptions = new Subscription();

  constructor() {
    effect(() => {
      this.editableTitle = this.chatbotService.activeTitle() || '';
    });
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Configura o contexto de sessão para criação de novas conversas
    this.chatbotService.setSessionConfig({
      contextType: this.contextType,
      title: this.chatTitle,
    });

    // Se um sessionId externo foi passado, retoma a conversa existente
    if (this.sessionId) {
      this.sidebarOpen = false;
      this.chatbotService.useSession(this.sessionId);
      if (this.restoreHistory) {
        this.chatbotService.loadHistory(this.sessionId);
      }
    }

    if (this.showHistory && this.sidebarOpen) {
      this.fetchConversations();
    }
  }

  ngAfterViewInit(): void {
    this.messageInput?.nativeElement?.focus();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll || this.loading()) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ── Histórico de conversas ───────────────────────────────────────────────────

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.sidebarOpen) {
      this.fetchConversations();
    }
  }

  private fetchConversations(): void {
    const user = this.userStore.getUser() as any;
    const userId = user?._id?.toString();
    this.conversationsLoading.set(true);

    this.subscriptions.add(
      this.estruturaApi.listConversations({
        userId,
        limit: 30,
        contextType: this.contextType,
      }).subscribe({
        next: (res: any) => {
          const items: any[] = Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.items)
            ? res.items
            : [];

          this.conversations.set(
            items.map((c: any) => ({
              conversationId: c.conversationId,
              sessionId: c.sessionId,
              contextType: c.contextType,
              title: typeof c.title === 'string' ? c.title : undefined,
              model: c.model,
              lastMessagePreview: c.lastMessagePreview,
              lastMessageAt: new Date(c.lastMessageAt),
              messageCount: c.messageCount ?? 0,
            })),
          );

          this.syncActiveConversationTitleFromList();
        },
        error: () => this.conversations.set([]),
        complete: () => this.conversationsLoading.set(false),
      }),
    );
  }

  loadConversation(conv: ConversationSummary): void {
    if (this.loading()) return;
    this.chatbotService.reset();
    this.chatbotService.setSessionConfig({
      contextType: conv.contextType || this.contextType,
      title: conv.title,
    });
    this.chatbotService.useSession(conv.sessionId, conv.title);
    this.chatbotService.loadHistory(conv.sessionId);
    this.syncRouteWithSession(conv.sessionId);

    this.sidebarOpen = false;
    this.shouldScroll = true;
  }

  /**
   * Inicia nova sessão: reseta o serviço (sessionId = null) e fecha sidebar.
   * A sessão será criada no backend automaticamente ao enviar a 1ª mensagem.
   */
  startNewSession(): void {
    this.chatbotService.reset();
    this.chatbotService.setSessionConfig({
      contextType: this.contextType,
      title: this.chatTitle,
    });
    this.historyNavIndex = -1;
    this.currentDraft = '';
    this.newMessage = '';
    this.pendingDeleteConversationId.set(null);
    this.renaming.set(false);
    this.sidebarOpen = false;
    this.syncRouteWithSession();

    queueMicrotask(() => this.messageInput?.nativeElement?.focus());
  }

  requestDeleteConversation(conversationId: string, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteConversationId.set(conversationId);
  }

  cancelDeleteConversation(event?: Event): void {
    event?.stopPropagation();
    this.pendingDeleteConversationId.set(null);
  }

  confirmDeleteConversation(conv: ConversationSummary, event: Event): void {
    event.stopPropagation();

    if (this.deletingConversationId()) return;

    this.deletingConversationId.set(conv.conversationId);

    this.subscriptions.add(
      this.estruturaApi.deleteConversation(conv.conversationId).subscribe({
        next: () => {
          this.conversations.update((items) =>
            items.filter((item) => item.conversationId !== conv.conversationId),
          );

          if (this.chatbotService.sessionId === conv.sessionId) {
            this.clearChat();
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Conversa apagada',
            detail: 'A conversa foi removida do histórico',
            life: 2000,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Falha ao apagar',
            detail: 'Não foi possível remover a conversa',
            life: 3000,
          });
        },
        complete: () => {
          this.deletingConversationId.set(null);
          this.pendingDeleteConversationId.set(null);
        },
      }),
    );
  }

  // ── Interação ────────────────────────────────────────────────────────────────

  onMessageChange(value: string): void {
    this.newMessage = value;
    if (this.historyNavIndex === -1) {
      this.currentDraft = value;
    }
  }

  handleKeyboard(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      this.clearChat();
      return;
    }

    const userMessages = this.messages()
      .filter((m) => m.role === 'user')
      .map((m) => m.content);

    if (userMessages.length === 0) return;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.historyNavIndex < userMessages.length - 1) {
        this.historyNavIndex++;
        this.newMessage = userMessages[userMessages.length - 1 - this.historyNavIndex];
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.historyNavIndex > -1) {
        this.historyNavIndex--;
        this.newMessage =
          this.historyNavIndex === -1
            ? this.currentDraft
            : userMessages[userMessages.length - 1 - this.historyNavIndex];
      }
    }
  }

  clearChat(): void {
    this.chatbotService.reset();
    this.chatbotService.setSessionConfig({
      contextType: this.contextType,
      title: this.chatTitle,
    });
    this.historyNavIndex = -1;
    this.currentDraft = '';
    this.newMessage = '';
    this.pendingDeleteConversationId.set(null);
    this.renaming.set(false);
    this.syncRouteWithSession();
  }

  send(): void {
    const text = this.newMessage.trim();
    if (!text || this.inputDisabled()) return;

    this.newMessage = '';
    this.currentDraft = '';
    this.historyNavIndex = -1;
    this.shouldScroll = true;

    this.syncConversationPreviewInList(text);
    this.chatbotService.send(text);
  }

  beginRename(): void {
    this.editableTitle = this.chatbotService.activeTitle() || '';
    this.renaming.set(true);
  }

  cancelRename(): void {
    this.editableTitle = this.chatbotService.activeTitle() || '';
    this.renaming.set(false);
  }

  saveTitle(): void {
    const normalizedTitle = this.normalizeTitle(this.editableTitle);
    this.chatbotService.setConversationTitle(normalizedTitle);

    const activeSessionId = this.chatbotService.sessionId;
    if (!activeSessionId) {
      this.renaming.set(false);
      return;
    }

    const currentConversation = this.conversations().find((item) => item.sessionId === activeSessionId);
    if (!currentConversation) {
      this.renaming.set(false);
      return;
    }

    this.renameSaving.set(true);
    this.subscriptions.add(
      this.estruturaApi
        .updateConversation(currentConversation.conversationId, normalizedTitle || 'Nova conversa')
        .subscribe({
          next: () => {
            this.syncConversationTitleInList(activeSessionId, normalizedTitle);
            this.messageService.add({
              severity: 'success',
              summary: 'Nome atualizado',
              detail: 'O nome da conversa foi atualizado',
              life: 2000,
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Falha ao renomear',
              detail: 'Não foi possível atualizar o nome da conversa',
              life: 3000,
            });
          },
          complete: () => {
            this.renameSaving.set(false);
            this.renaming.set(false);
          },
        }),
    );
  }

  cancel(): void {
    this.chatbotService.cancel();
    this.shouldScroll = true;
    queueMicrotask(() => this.messageInput?.nativeElement?.focus());
  }

  copyToClipboard(text: string): void {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => this.showCopySuccess())
        .catch(() => this.copyFallback(text));
    } else {
      this.copyFallback(text);
    }
  }

  private copyFallback(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      this.showCopySuccess();
    } catch { /* ignore */ }
    document.body.removeChild(textArea);
  }

  private showCopySuccess(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Copiado',
      detail: 'Mensagem copiada para a área de transferência',
      life: 2000,
    });
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch { /* ignore */ }
  }

  // ── Utils de template ────────────────────────────────────────────────────────

  formatRelativeTime(date: Date): string {
    if (!date) return '';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin}min atrás`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h atrás`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d atrás`;
  }

  getConversationDisplayTitle(conv: ConversationSummary): string {
    return conv.title?.trim() || 'Nova conversa';
  }

  getConversationPreview(conv: ConversationSummary): string {
    const preview = conv.lastMessagePreview;
    if (typeof preview === 'string' && preview.trim()) {
      return preview.trim();
    }

    if (preview && typeof preview === 'object') {
      const content = (preview as Record<string, unknown>)['content'];
      if (typeof content === 'string' && content.trim()) {
        return content.trim();
      }
    }

    return '(sem mensagens)';
  }

  private normalizeTitle(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private syncConversationTitleInList(sessionId: string, title?: string): void {
    this.conversations.update((items) =>
      items.map((item) => (item.sessionId === sessionId ? { ...item, title } : item)),
    );
  }

  private syncConversationPreviewInList(preview: string): void {
    const activeSessionId = this.chatbotService.sessionId;
    if (!activeSessionId) return;

    this.conversations.update((items) =>
      items.map((item) =>
        item.sessionId === activeSessionId
          ? {
              ...item,
              lastMessagePreview: preview,
              lastMessageAt: new Date(),
            }
          : item,
      ),
    );
  }

  private syncActiveConversationTitleFromList(): void {
    const activeSessionId = this.chatbotService.sessionId;
    if (!activeSessionId || this.chatbotService.activeTitle()?.trim()) return;

    const activeConversation = this.conversations().find((item) => item.sessionId === activeSessionId);
    if (!activeConversation?.title?.trim()) return;

    this.chatbotService.useSession(activeSessionId, activeConversation.title);
  }

  private syncRouteWithSession(sessionId?: string): void {
    const commands = sessionId
      ? ['/estrutura/chatbot', sessionId]
      : ['/estrutura/chatbot'];
    void this.router.navigate(commands, { replaceUrl: true });
  }
}
