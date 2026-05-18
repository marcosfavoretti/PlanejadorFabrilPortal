import { Injectable, computed, signal, inject } from '@angular/core';
import { Observable, Subscription, switchMap, of } from 'rxjs';
import { estruturaApiEndpoints } from '../config/estrutura-api-endpoints';
import { EstruturaApiService } from './EstruturaApi.service';

export interface ChatAttachment {
  type: 'image';
  url: string;
  mimeType?: string;
  alt?: string;
  partcode?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  interrupted?: boolean;
  attachments?: ChatAttachment[];
}

export interface ConversationSummary {
  conversationId: string;
  sessionId: string;
  contextType: string;
  title?: string;
  model: string;
  lastMessagePreview?: unknown;
  lastMessageAt: Date;
  messageCount: number;
}

export interface ChatSessionConfig {
  contextType: string;
  title?: string;
}

interface SendChatOptions {
  stream?: boolean;
}

/** Configuração padrão de contexto quando não especificado pelo host */
const DEFAULT_CONTEXT: ChatSessionConfig = {
  contextType: 'default',
};

/**
 * ChatbotService — não é singleton global.
 * Deve ser provido no nível do componente ou feature-module para
 * permitir múltiplas instâncias independentes (DRY / reutilização).
 *
 * Fluxo de sessão:
 *  1. Ao enviar a 1ª mensagem (sem sessão ativa) ou ao criar nova sessão:
 *     → POST /chatbot/conversations → recebe sessionId do backend
 *  2. sessionId do backend é usado em todas as mensagens subsequentes
 *  3. Ao carregar conversa do histórico: sessionId vem do backend diretamente
 */
@Injectable()
export class ChatbotService {
  private readonly estruturaApi = inject(EstruturaApiService);
  private activeRequestSubscription?: Subscription;
  private createSessionSubscription?: Subscription;

  // ── Estado ────────────────────────────────────────────────────────────────
  readonly messages = signal<ChatMessage[]>([]);
  readonly loading = signal(false);
  readonly historyLoading = signal(false);
  readonly sessionCreating = signal(false);
  private readonly hasActiveExecution = signal(false);
  readonly canCancel = computed(() => this.loading() && this.hasActiveExecution());

  /** Título da conversa ativa */
  readonly activeTitle = signal<string | undefined>(undefined);

  /** sessionId confirmado pelo backend. null = ainda não tem sessão */
  private _sessionId: string | null = null;

  /** Contexto usado para criar novas sessões */
  private _sessionConfig: ChatSessionConfig = { ...DEFAULT_CONTEXT };

  get sessionId(): string | null {
    return this._sessionId;
  }

  get hasSession(): boolean {
    return this._sessionId !== null;
  }

  // ── Configuração ──────────────────────────────────────────────────────────

  /**
   * Define o contexto para criação de novas sessões.
   * Deve ser chamado pelo componente host antes do primeiro envio.
   */
  setSessionConfig(config: Partial<ChatSessionConfig>): void {
    this._sessionConfig = { ...DEFAULT_CONTEXT, ...config };
    // Se ainda não tem sessão ativa, assume o título configurado como inicial
    if (!this._sessionId) {
      this.activeTitle.set(this._sessionConfig.title);
    }
  }

  setConversationTitle(title?: string): void {
    const normalizedTitle = title?.trim() || undefined;
    this._sessionConfig = { ...this._sessionConfig, title: normalizedTitle };
    this.activeTitle.set(normalizedTitle);
  }

  // ── Ciclo de vida ──────────────────────────────────────────────────────────

  /**
   * Define um sessionId externo (para retomar uma conversa existente).
   * Isso NÃO carrega o histórico automaticamente — chame `loadHistory()` depois.
   */
  useSession(sessionId: string, title?: string): void {
    this._sessionId = sessionId;
    this.activeTitle.set(title?.trim() || undefined);
  }

  /**
   * Carrega o histórico de mensagens do backend para a sessão atual.
   * Filtra apenas mensagens user/assistant com conteúdo visível.
   */
  loadHistory(sessionId?: string): void {
    const sid = sessionId ?? this._sessionId;
    if (!sid) return;

    if (sessionId) {
      this._sessionId = sessionId;
    }

    this.historyLoading.set(true);

    this.estruturaApi.getHistory(sid).subscribe({
      next: (messages: any[]) => {
        const chatMessages: ChatMessage[] = messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .filter((m) => m.content)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: this.rewriteImageUrls(m.content ?? ''),
            timestamp: m.createdAt ? new Date(m.createdAt) : new Date(),
            interrupted: false,
            attachments: this.normalizeAttachments(m.attachments),
          }));
        this.messages.set(chatMessages);
      },
      error: () => {
        this.messages.set([]);
      },
      complete: () => {
        this.historyLoading.set(false);
      },
    });
  }

  // ── Criação de sessão ─────────────────────────────────────────────────────

  /**
   * Cria uma nova sessão no backend.
   * Retorna Observable<string> com o sessionId gerado.
   */
  createSession(): Observable<string> {
    const { contextType, title } = this._sessionConfig;
    return new Observable<string>((subscriber) => {
      this.sessionCreating.set(true);
      this.createSessionSubscription = this.estruturaApi
        .createConversation(contextType, title)
        .subscribe({
          next: (res) => {
            this._sessionId = res.sessionId;
            this.activeTitle.set(res['title'] || title);
            subscriber.next(res.sessionId);
            subscriber.complete();
          },
          error: (err) => {
            this.sessionCreating.set(false);
            subscriber.error(err);
          },
          complete: () => {
            this.sessionCreating.set(false);
          },
        });
    });
  }

  // ── Envio de mensagem ──────────────────────────────────────────────────────

  /**
   * Envia uma mensagem.
   * Se ainda não houver sessionId (nova conversa), cria a sessão primeiro.
   */
  send(text: string, options: SendChatOptions = {}): void {
    const { stream = true } = options;

    // Otimisticamente adiciona a msg do usuário à UI imediatamente
    this.messages.update((m) => [
      ...m,
      { role: 'user', content: text, timestamp: new Date() },
    ]);
    this.loading.set(true);
    this.hasActiveExecution.set(true);

    // Se já tem sessão, envia direto; caso contrário, cria primeiro
    const sessionReady$: Observable<string> = this._sessionId
      ? of(this._sessionId)
      : this.createSession();

    this.activeRequestSubscription = sessionReady$
      .pipe(
        switchMap((sessionId) => {
          if (stream) {
            return this.sendStream(sessionId, text);
          }
          return this.sendNonStream(sessionId, text);
        }),
      )
      .subscribe({
        error: () => this.handleSendError(),
      });
  }

  // ── Envio stream ───────────────────────────────────────────────────────────

  private sendStream(sessionId: string, text: string): Observable<never> {
    // Adiciona a bolha do assistente vazia (para streaming progressivo)
    this.messages.update((messages) => [
      ...messages,
      { role: 'assistant', content: '', timestamp: new Date(), interrupted: false },
    ]);

    return new Observable<never>((subscriber) => {
      const sub = this.estruturaApi
        .sendMessageStream({
          sessionId,
          message: text,
          contextType: this._sessionConfig.contextType,
          title: this.activeTitle(),
          stream: true,
        })
        .subscribe({
          next: (data) => {
            if (data.type === 'chunk') {
              if (data.content) {
                this.patchAssistantMessage((current) => ({
                  ...current,
                  content: this.rewriteImageUrls(current.content + data.content),
                  interrupted: false,
                }));
              }
            } else if (data.type === 'reset') {
              this.patchAssistantMessage((current) => ({
                ...current,
                content: '',
                interrupted: false,
              }));
            } else if (data.type === 'done') {
              if (data.content !== undefined || data.attachments) {
                this.patchAssistantMessage((current) => {
                  const newContent =
                    data.content !== undefined ? data.content : current.content;
                  return {
                    ...current,
                    content: this.rewriteImageUrls(newContent),
                    attachments: this.normalizeAttachments(
                      data.attachments ?? current.attachments,
                    ),
                    interrupted: false,
                  };
                });
              }
              this.clearActiveExecutionState();
              subscriber.complete();
            }
          },
          complete: () => {
            this.clearActiveExecutionState();
            subscriber.complete();
          },
          error: (err) => {
            subscriber.error(err);
          },
        });

      return () => sub.unsubscribe();
    });
  }

  // ── Envio não-stream ───────────────────────────────────────────────────────

  private sendNonStream(sessionId: string, text: string): Observable<never> {
    return new Observable<never>((subscriber) => {
      const sub = this.estruturaApi
        .sendMessage({
          sessionId,
          message: text,
          contextType: this._sessionConfig.contextType,
          title: this.activeTitle(),
          stream: false,
        })
        .subscribe({
          next: (res: unknown) => {
            const responseText = this.rewriteImageUrls(this.extractResponseText(res));
            const attachments = this.normalizeAttachments(
              (res as any)?.completion?.message?.attachments ??
                (res as any)?.message?.attachments,
            );
            this.messages.update((m) => [
              ...m,
              {
                role: 'assistant',
                content: responseText,
                timestamp: new Date(),
                interrupted: false,
                attachments,
              },
            ]);
            this.clearActiveExecutionState();
            subscriber.complete();
          },
          error: (err) => subscriber.error(err),
          complete: () => {
            this.clearActiveExecutionState();
            subscriber.complete();
          },
        });

      return () => sub.unsubscribe();
    });
  }

  // ── Cancelar / Reset ───────────────────────────────────────────────────────

  cancel(): void {
    if (!this.hasActiveExecution()) return;

    this.activeRequestSubscription?.unsubscribe();
    this.activeRequestSubscription = undefined;

    if (this._sessionId) {
      this.estruturaApi.cancelMessage({ sessionId: this._sessionId }).subscribe({
        error: () => undefined,
      });
    }

    this.markLastAssistantInterrupted();
    this.loading.set(false);
    this.hasActiveExecution.set(false);
  }

  /**
   * Reseta o chat: cancela execução ativa e limpa o estado.
   * A sessão é apagada (null) — a próxima mensagem vai criar nova sessão no backend.
   */
  reset(): void {
    this.createSessionSubscription?.unsubscribe();
    this.createSessionSubscription = undefined;

    if (this.hasActiveExecution() && this._sessionId) {
      this.activeRequestSubscription?.unsubscribe();
      this.activeRequestSubscription = undefined;
      this.estruturaApi.cancelMessage({ sessionId: this._sessionId }).subscribe({
        error: () => undefined,
      });
    }

    // Limpa sessão — próxima msg vai criar nova via backend
    this._sessionId = null;
    this.messages.set([]);
    this.loading.set(false);
    this.sessionCreating.set(false);
    this.hasActiveExecution.set(false);

    this.activeTitle.set(this._sessionConfig.title);
  }

  // ── Helpers privados ───────────────────────────────────────────────────────

  private rewriteImageUrls(text: string): string {
    return text.replace(
      /\]\(\/image\?partcode=/g,
      `](${estruturaApiEndpoints.image()}?partcode=`,
    );
  }

  private normalizeAttachments(attachments: any): ChatAttachment[] | undefined {
    if (!Array.isArray(attachments) || attachments.length === 0) return undefined;
    return attachments.map((a: any) => ({
      ...a,
      url: a.url?.startsWith('/')
        ? estruturaApiEndpoints.resolveUrl(a.url)
        : a.url,
    }));
  }

  private extractResponseText(res: unknown): string {
    if (typeof res === 'string') return res;
    const content = (res as any)?.message?.content;
    if (content) {
      return typeof content === 'object' ? JSON.stringify(content) : String(content);
    }
    return JSON.stringify(res);
  }

  private patchAssistantMessage(updater: (current: ChatMessage) => ChatMessage): void {
    this.messages.update((messages) => {
      const nextMessages = [...messages];
      let assistantIndex = -1;
      for (let i = nextMessages.length - 1; i >= 0; i--) {
        if (nextMessages[i].role === 'assistant') {
          assistantIndex = i;
          break;
        }
      }
      if (assistantIndex === -1) {
        nextMessages.push(
          updater({ role: 'assistant', content: '', timestamp: new Date(), interrupted: false }),
        );
        return nextMessages;
      }
      nextMessages[assistantIndex] = updater(nextMessages[assistantIndex]);
      return nextMessages;
    });
  }

  private markLastAssistantInterrupted(): void {
    this.patchAssistantMessage((current) => ({
      ...current,
      interrupted: true,
      timestamp: current.timestamp ?? new Date(),
    }));
  }

  private clearActiveExecutionState(): void {
    this.activeRequestSubscription = undefined;
    this.loading.set(false);
    this.hasActiveExecution.set(false);
  }

  private handleSendError(): void {
    const fallback = 'Desculpe, ocorreu um erro ao processar sua mensagem.';
    this.patchAssistantMessage((current) => ({
      ...current,
      content: current.content || fallback,
      interrupted: false,
    }));
    this.clearActiveExecutionState();
  }
}
