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
  OnChanges,
  Input,
  SimpleChanges,
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
export class ChatbotWidgetComponent implements OnInit, AfterViewChecked, AfterViewInit, OnDestroy, OnChanges {
  private static readonly INPUT_MAX_HEIGHT_PX = 220;

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
  @ViewChild('messageInput') private messageInput!: ElementRef<HTMLDivElement>;

  // ── Estado do componente ────────────────────────────────────────────────────
  readonly messages = this.chatbotService.messages;
  readonly loading = this.chatbotService.loading;
  readonly canCancel = this.chatbotService.canCancel;
  readonly historyLoading = this.chatbotService.historyLoading;
  readonly sessionCreating = this.chatbotService.sessionCreating;

  /** Título computado: usa o nome da conversa se disponível, senão o título padrão */
  readonly computedTitle = computed(() => this.chatbotService.activeTitle() || this.title);
  readonly canShareActiveConversation = computed(() => !!this.chatbotService.conversationId);

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
  sharingConversationId = signal<string | null>(null);

  private subscriptions = new Subscription();
  private activeTitleRetryTimer: ReturnType<typeof setTimeout> | null = null;

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

    this.restoreSessionFromInput();

    if (this.showHistory && (this.sidebarOpen || !!this.sessionId)) {
      this.fetchConversations();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessionId'] || changes['restoreHistory']) {
      this.restoreSessionFromInput();

      if (this.showHistory && this.sessionId) {
        this.fetchConversations();
      }
    }
  }

  ngAfterViewInit(): void {
    this.messageInput?.nativeElement?.focus();
    this.resizeMessageInput();
    this.renderEditorFromValue(this.newMessage);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll || this.loading()) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    if (this.activeTitleRetryTimer) {
      clearTimeout(this.activeTitleRetryTimer);
    }
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
    const user = this.userStore.get() as any;
    const userId = user?._id?.toString();
    this.conversationsLoading.set(true);

    this.subscriptions.add(
      this.estruturaApi.listConversations({
        userId,
        limit: 100,
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
              shareId: this.normalizeOptionalId(c.shareId),
              parentConversationId: this.normalizeOptionalId(c.parentConversationId),
              rootConversationId: this.normalizeOptionalId(c.rootConversationId),
            })),
          );

          this.syncActiveConversationTitleFromList();
        },
        error: () => {
          this.conversations.set([]);
          this.scheduleActiveConversationTitleRetry();
        },
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
    this.chatbotService.useSession(conv.sessionId, conv.title, conv.conversationId);
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

    queueMicrotask(() => {
      this.messageInput?.nativeElement?.focus();
      this.resizeMessageInput();
    });
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

  shareConversation(conv: ConversationSummary, event?: Event): void {
    event?.stopPropagation();

    if (this.sharingConversationId()) return;

    this.sharingConversationId.set(conv.conversationId);

    this.subscriptions.add(
      this.estruturaApi.shareConversation(conv.conversationId).subscribe({
        next: (share) => {
          this.syncConversationShareInList(conv.conversationId, share.shareId);
          this.copyShareLink(share.shareId);
          this.messageService.add({
            severity: 'success',
            summary: 'Link copiado',
            detail: 'O link da conversa compartilhada foi copiado.',
            life: 2500,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Falha ao compartilhar',
            detail: 'Não foi possível gerar o link desta conversa.',
            life: 3000,
          });
        },
        complete: () => {
          this.sharingConversationId.set(null);
        },
      }),
    );
  }

  shareActiveConversation(): void {
    const activeConversation = this.getActiveConversation();
    if (activeConversation) {
      this.shareConversation(activeConversation);
      return;
    }

    const conversationId = this.chatbotService.conversationId;
    if (!conversationId) return;

    this.sharingConversationId.set(conversationId);
    this.subscriptions.add(
      this.estruturaApi.shareConversation(conversationId).subscribe({
        next: (share) => {
          this.copyShareLink(share.shareId);
          this.syncConversationShareInList(conversationId, share.shareId);
          this.fetchConversations();
          this.messageService.add({
            severity: 'success',
            summary: 'Link copiado',
            detail: 'O link da conversa compartilhada foi copiado.',
            life: 2500,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Falha ao compartilhar',
            detail: 'Não foi possível gerar o link desta conversa.',
            life: 3000,
          });
        },
        complete: () => {
          this.sharingConversationId.set(null);
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
    this.renderEditorFromValue(value);
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

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
      return;
    }

    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      this.insertHtmlAtCursor('<br>');
      this.syncMessageFromEditor();
      return;
    }

    const editor = this.messageInput?.nativeElement;
    const hasSelection = this.selectionHasRange();
    const caretAtStart = this.isCaretAtStart(editor);
    const caretAtEnd = this.isCaretAtEnd(editor);

    if (userMessages.length === 0) return;

    if (event.key === 'ArrowUp' && !hasSelection && caretAtStart) {
      event.preventDefault();
      if (this.historyNavIndex < userMessages.length - 1) {
        this.historyNavIndex++;
        this.onMessageChange(userMessages[userMessages.length - 1 - this.historyNavIndex]);
      }
    } else if (event.key === 'ArrowDown' && !hasSelection && caretAtEnd) {
      event.preventDefault();
      if (this.historyNavIndex > -1) {
        this.historyNavIndex--;
        this.onMessageChange(
          this.historyNavIndex === -1
            ? this.currentDraft
            : userMessages[userMessages.length - 1 - this.historyNavIndex],
        );
      }
    }
  }

  handlePaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const html = clipboardData.getData('text/html');
    const plain = clipboardData.getData('text/plain');
    event.preventDefault();
    const tableRows = this.extractTableRowsFromClipboard(html, plain);

    if (tableRows) {
      this.insertHtmlAtCursor(this.buildEditorTableHtml(tableRows));
    } else {
      this.insertHtmlAtCursor(this.buildEditorTextHtml(plain));
    }

    this.syncMessageFromEditor();
  }

  handleEditorInput(): void {
    this.syncMessageFromEditor();
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
    this.resizeMessageInput();
    this.renderEditorFromValue('');
  }

  send(): void {
    const text = this.newMessage.trim();
    if (!text || this.inputDisabled()) return;

    this.newMessage = '';
    this.currentDraft = '';
    this.historyNavIndex = -1;
    this.shouldScroll = true;
    this.renderEditorFromValue('');

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
    this.writeTextToClipboard(text, () => this.showCopySuccess());
  }

  private copyFallback(text: string, onSuccess?: () => void): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      onSuccess?.();
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

  getConversationOriginLabel(conv: ConversationSummary): string | null {
    if (conv.parentConversationId) {
      return 'Sua cópia';
    }

    if (conv.shareId) {
      return 'Compartilhada';
    }

    return null;
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch { /* ignore */ }
  }

  private resizeMessageInput(): void {
    const editor = this.messageInput?.nativeElement;
    if (!editor) return;

    requestAnimationFrame(() => {
      editor.style.height = 'auto';
      const contentHeight = Math.max(editor.scrollHeight, editor.offsetHeight, 45);
      const nextHeight = Math.min(contentHeight, ChatbotWidgetComponent.INPUT_MAX_HEIGHT_PX);
      editor.style.height = `${nextHeight}px`;
      editor.style.overflowY =
        contentHeight > ChatbotWidgetComponent.INPUT_MAX_HEIGHT_PX ? 'auto' : 'hidden';
    });
  }

  private syncMessageFromEditor(): void {
    const editor = this.messageInput?.nativeElement;
    if (!editor) return;

    this.newMessage = this.serializeEditorContent(editor).trim();
    if (this.historyNavIndex === -1) {
      this.currentDraft = this.newMessage;
    }
    this.resizeMessageInput();
  }

  private renderEditorFromValue(value: string): void {
    const editor = this.messageInput?.nativeElement;
    if (!editor) return;

    editor.innerHTML = this.buildEditorHtmlFromMarkdown(value);
    this.placeCaretAtEnd(editor);
    this.resizeMessageInput();
  }

  private insertHtmlAtCursor(html: string): void {
    const editor = this.messageInput?.nativeElement;
    if (!editor) return;

    editor.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editor.insertAdjacentHTML('beforeend', html);
      this.placeCaretAtEnd(editor);
      this.resizeMessageInput();
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const template = document.createElement('template');
    template.innerHTML = html;
    const fragment = template.content;
    const lastNode = fragment.lastChild;

    range.insertNode(fragment);

    if (lastNode) {
      const nextRange = document.createRange();
      nextRange.setStartAfter(lastNode);
      nextRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(nextRange);
    }

    this.resizeMessageInput();
  }

  private extractTableRowsFromClipboard(html: string, plain: string): string[][] | null {
    const htmlRows = this.extractHtmlTableRows(html);
    if (htmlRows) return htmlRows;

    return this.extractDelimitedRows(plain);
  }

  private extractHtmlTableRows(html: string): string[][] | null {
    if (!html || !html.includes('<table')) return null;

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = Array.from(doc.querySelectorAll('tr'))
      .map((row) =>
        Array.from(row.querySelectorAll('th, td')).map((cell) =>
          this.normalizeTableCell(cell.textContent ?? ''),
        ),
      )
      .filter((row) => row.length > 0);

    return this.isValidTableRows(rows) ? rows : null;
  }

  private extractDelimitedRows(text: string): string[][] | null {
    if (!text.includes('\t')) return null;

    const rows = text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.trim().length > 0)
      .map((line) => line.split('\t').map((cell) => this.normalizeTableCell(cell)));

    return this.isValidTableRows(rows) ? rows : null;
  }

  private isValidTableRows(rows: string[][]): boolean {
    if (rows.length < 2) return false;

    const columnCount = rows[0].length;
    return columnCount >= 2 && rows.every((row) => row.length === columnCount);
  }

  private rowsToMarkdownTable(rows: string[][]): string | null {
    if (!this.isValidTableRows(rows)) return null;

    const columnCount = rows[0].length;

    const normalizedRows = rows.map((row) => row.map((cell) => cell || ' '));
    const widths = Array.from({ length: columnCount }, (_, columnIndex) =>
      Math.max(...normalizedRows.map((row) => row[columnIndex].length), 3),
    );

    const formatRow = (row: string[]) =>
      `| ${row.map((cell, index) => cell.padEnd(widths[index])).join(' | ')} |`;
    const separator = `| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`;

    return [formatRow(normalizedRows[0]), separator, ...normalizedRows.slice(1).map(formatRow)].join('\n');
  }

  private normalizeTableCell(value: string): string {
    return value.replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');
  }

  private buildEditorTableHtml(rows: string[][]): string {
    const [header, ...body] = rows;
    const headerHtml = header.map((cell) => `<th>${this.escapeHtml(cell)}</th>`).join('');
    const bodyHtml = body
      .map(
        (row) => `<tr>${row.map((cell) => `<td>${this.escapeHtml(cell)}</td>`).join('')}</tr>`,
      )
      .join('');

    return `<table class="input-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table><p><br></p>`;
  }

  private buildEditorTextHtml(value: string): string {
    const normalized = value.replace(/\r\n/g, '\n');
    if (!normalized.trim()) {
      return '';
    }

    return normalized
      .split('\n')
      .map((line) => (line.length ? `<div>${this.escapeHtml(line)}</div>` : '<div><br></div>'))
      .join('');
  }

  private buildEditorHtmlFromMarkdown(value: string): string {
    const normalized = value.replace(/\r\n/g, '\n').trim();
    if (!normalized) {
      return '';
    }

    const lines = normalized.split('\n');
    const blocks: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (this.isMarkdownTableStart(lines, i)) {
        const rows: string[][] = [];
        rows.push(this.parseMarkdownTableRow(lines[i]));
        i += 2;

        while (i < lines.length && lines[i].includes('|')) {
          rows.push(this.parseMarkdownTableRow(lines[i]));
          i++;
        }

        i--;
        blocks.push(this.buildEditorTableHtml(rows));
        continue;
      }

      blocks.push(lines[i].length ? `<div>${this.escapeHtml(lines[i])}</div>` : '<div><br></div>');
    }

    return blocks.join('');
  }

  private serializeEditorContent(root: HTMLElement): string {
    const parts: string[] = [];

    for (const node of Array.from(root.childNodes)) {
      this.serializeNode(node, parts);
    }

    return parts
      .join('')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private serializeNode(node: ChildNode, parts: string[]): void {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent ?? '');
      return;
    }

    if (!(node instanceof HTMLElement)) {
      return;
    }

    const tagName = node.tagName.toLowerCase();

    if (tagName === 'br') {
      parts.push('\n');
      return;
    }

    if (tagName === 'table') {
      const rows = Array.from(node.querySelectorAll('tr'))
        .map((row) =>
          Array.from(row.querySelectorAll('th, td')).map((cell) =>
            this.normalizeTableCell(cell.textContent ?? ''),
          ),
        )
        .filter((row) => row.length > 0);

      const markdown = this.rowsToMarkdownTable(rows);
      if (markdown) {
        parts.push(`${markdown}\n\n`);
      }
      return;
    }

    if (tagName === 'div' || tagName === 'p') {
      const blockParts: string[] = [];
      for (const child of Array.from(node.childNodes)) {
        this.serializeNode(child, blockParts);
      }

      const blockText = blockParts.join('');
      parts.push(blockText);
      parts.push('\n');
      return;
    }

    for (const child of Array.from(node.childNodes)) {
      this.serializeNode(child, parts);
    }
  }

  private isMarkdownTableStart(lines: string[], index: number): boolean {
    if (index + 1 >= lines.length) return false;
    return /\|/.test(lines[index]) && /^\|?[\s:-]+(\|[\s:-]+)+\|?$/.test(lines[index + 1].trim());
  }

  private parseMarkdownTableRow(line: string): string[] {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim().replace(/\\\|/g, '|'));
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private placeCaretAtEnd(element: HTMLElement): void {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private selectionHasRange(): boolean {
    const selection = window.getSelection();
    return !!selection && !selection.isCollapsed;
  }

  private isCaretAtStart(editor?: HTMLDivElement): boolean {
    return this.getCaretTextBefore(editor).length === 0;
  }

  private isCaretAtEnd(editor?: HTMLDivElement): boolean {
    return this.getCaretTextAfter(editor).length === 0;
  }

  private getCaretTextBefore(editor?: HTMLDivElement): string {
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return '';

    const range = selection.getRangeAt(0).cloneRange();
    range.selectNodeContents(editor);
    range.setEnd(selection.anchorNode!, selection.anchorOffset);
    return range.toString();
  }

  private getCaretTextAfter(editor?: HTMLDivElement): string {
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return '';

    const range = selection.getRangeAt(0).cloneRange();
    range.selectNodeContents(editor);
    range.setStart(selection.focusNode!, selection.focusOffset);
    return range.toString();
  }

  private looksLikeMarkdownTable(value: string): boolean {
    const lines = value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) return false;

    return /\|/.test(lines[0]) && /^\|?[\s:-]+(\|[\s:-]+)+\|?$/.test(lines[1]);
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

  private syncConversationShareInList(conversationId: string, shareId: string): void {
    this.conversations.update((items) =>
      items.map((item) =>
        item.conversationId === conversationId
          ? { ...item, shareId }
          : item,
      ),
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
    if (!activeConversation?.title?.trim()) {
      this.scheduleActiveConversationTitleRetry();
      return;
    }

    this.chatbotService.useSession(
      activeSessionId,
      activeConversation.title,
      activeConversation.conversationId,
    );
  }

  private restoreSessionFromInput(): void {
    if (!this.sessionId) return;

    this.sidebarOpen = false;
    this.chatbotService.useSession(this.sessionId);

    if (this.restoreHistory) {
      this.chatbotService.loadHistory(this.sessionId);
    }
  }

  private scheduleActiveConversationTitleRetry(): void {
    if (!this.sessionId || this.chatbotService.activeTitle()?.trim() || this.activeTitleRetryTimer) {
      return;
    }

    this.activeTitleRetryTimer = setTimeout(() => {
      this.activeTitleRetryTimer = null;
      this.fetchConversations();
    }, 800);
  }

  private syncRouteWithSession(sessionId?: string): void {
    const commands = sessionId
      ? ['/estrutura/chatbot', sessionId]
      : ['/estrutura/chatbot'];
    void this.router.navigate(commands, { replaceUrl: true });
  }

  private getActiveConversation(): ConversationSummary | undefined {
    const activeSessionId = this.chatbotService.sessionId;
    if (!activeSessionId) return undefined;

    return this.conversations().find((item) => item.sessionId === activeSessionId);
  }

  private buildShareLink(shareId: string): string {
    return `${window.location.origin}/estrutura/chatbot/share/${shareId}`;
  }

  private copyShareLink(shareId: string): void {
    this.writeTextToClipboard(this.buildShareLink(shareId));
  }

  private normalizeOptionalId(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const candidateKeys = ['id', '_id', '$oid', 'value'];

      for (const key of candidateKeys) {
        const candidate = record[key];
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim();
        }
      }
    }

    return undefined;
  }

  private writeTextToClipboard(text: string, onSuccess?: () => void): void {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => onSuccess?.())
        .catch(() => this.copyFallback(text, onSuccess));
      return;
    }

    this.copyFallback(text, onSuccess);
  }
}
