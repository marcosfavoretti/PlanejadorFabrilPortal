import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, computed, inject, OnDestroy, OnInit, QueryList, SecurityContext, signal, ViewChildren } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { Image, ImageModule } from 'primeng/image';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';
import { PartcodeImageService } from '@/app/shared/services/partcode-image.service';
import { LocalStorageService } from '@/app/shared/services/local-storage.service';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { LaserBoardDto, LaserBoardListDto, MoveLaserBoardCardDto, ProgramaLaserDetalheDto } from '@/api/proucao-fabrica';
import { LaserPlan, LaserPlanColumn, LaserPlanColumnKind, LaserPlanPagination } from '../../models/laser-plan.model';
import { LaserPlanColumnComponent } from '../../components/laser-plan-column/laser-plan-column.component';
import { ProducaoFabricaApiService } from '../../services/producao-fabrica-api.service';

const PAGE_SIZE = 10;
const LASER_PREFERENCE_STORAGE_KEY = 'prod-laser.laser-preference';

type LaserPreference = 'ALL' | 'BYSTRONIC' | 'LVD';
type ProgramaLaserDetalhe = ProgramaLaserDetalheDto & { legenda?: unknown };

@Component({
  selector: 'app-prod-laser-page',
  standalone: true,
  imports: [CommonModule, ConfirmPopupModule, DialogModule, ImageModule, PageLayoutComponent, LaserPlanColumnComponent],
  providers: [ConfirmationService],
  templateUrl: './prod-laser-page.component.html',
  styleUrl: './prod-laser-page.component.css',
})
export class ProdLaserPageComponent implements OnInit, OnDestroy {
  @ViewChildren(Image) private readonly detailImages!: QueryList<Image>;
  private readonly producaoFabricaApi = inject(ProducaoFabricaApiService);
  private readonly partcodeImageService = inject(PartcodeImageService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly userStore = inject(UserstoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly lastUpdated = signal('');
  protected readonly availablePlansLoading = signal(false);
  protected readonly availablePlansError = signal<string | null>(null);
  protected readonly globalFilter = signal('');
  protected readonly selectedPlan = signal<LaserPlan | null>(null);
  protected readonly programDetails = signal<ProgramaLaserDetalhe[]>([]);
  protected readonly programDetailsLoading = signal(false);
  protected readonly programDetailsError = signal<string | null>(null);
  protected readonly nestingPreview = signal<string | null>(null);
  protected readonly nestingPreviewSvg = signal<string | null>(null);
  protected readonly selectedDetailItem = signal<string | null>(null);
  protected readonly nestingPreviewLoading = signal(false);
  protected readonly nestingPreviewError = signal<string | null>(null);
  private readonly nestingLegendByItem = signal<ReadonlyMap<string, string>>(new Map());
  protected readonly planColumns = signal<LaserPlanColumn[]>([]);
  protected readonly laserPreference = signal<LaserPreference>('ALL');
  protected readonly loadingListIds = signal<ReadonlySet<string>>(new Set());
  protected readonly bulkMovingListIds = signal<ReadonlySet<string>>(new Set());
  protected readonly visiblePlanColumns = computed(() => this.planColumns()
    .filter((column) => this.isListVisible(column)));
  protected readonly connectedPlanColumns = computed(() => this.visiblePlanColumns().map((column) => column.id));
  protected readonly machineTargetLists = computed(() => this.visiblePlanColumns()
    .filter((column) => column.kind === 'machine')
    .map((column) => ({ id: column.id, title: column.title })));
  protected readonly hasActiveFilter = computed(() => Boolean(this.globalFilter().trim()));
  protected readonly isLaserReadOnly = computed(() => {
    const user = this.userStore.item();

    // O acesso público mantém a mesma visão de conferência do cargo PRODUCAO_LASER.
    if (!user) return true;

    return user.cargosLista.some((cargo) => cargo.trim().toUpperCase() === 'PRODUCAO_LASER');
  });
  private filterDebounce?: ReturnType<typeof setTimeout>;
  private readonly listRefreshTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly sseRefreshListIds = new Set<string>();
  private sseAnimationTimer?: ReturnType<typeof setTimeout>;
  private boardEventsSubscription?: Subscription;
  private routeParamsSubscription?: Subscription;
  private boardRequestSequence = 0;
  private programDetailsRequestSequence = 0;
  private nestingPreviewRequestSequence = 0;
  private readonly escapeListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') this.closeDetailsOnEscape(event);
  };

  ngOnInit(): void {
    this.loadLaserPreference();
    window.addEventListener('keydown', this.escapeListener, true);
    this.loadBoard();
    this.routeParamsSubscription = this.route.paramMap.subscribe((params) => {
      const numPrograma = params.get('numPrograma');
      if (!numPrograma) {
        this.selectedPlan.set(null);
        return;
      }

      const plan = this.planColumns()
        .flatMap((column) => column.plans)
        .find((card) => card.numPrograma === numPrograma) ?? this.createDetailPlan(numPrograma);
      this.showPlanDetails(plan);
    });
    this.boardEventsSubscription = this.producaoFabricaApi.escutarEventosDoQuadro()
      .subscribe(() => this.syncListsFromEvent());
  }

  ngOnDestroy(): void {
    if (this.filterDebounce) clearTimeout(this.filterDebounce);
    this.listRefreshTimers.forEach((timer) => clearTimeout(timer));
    if (this.sseAnimationTimer) clearTimeout(this.sseAnimationTimer);
    this.boardEventsSubscription?.unsubscribe();
    this.routeParamsSubscription?.unsubscribe();
    window.removeEventListener('keydown', this.escapeListener, true);
  }

  protected refresh(): void {
    this.loadBoard();
  }

  protected setLaserPreference(preference: LaserPreference): void {
    this.laserPreference.set(preference);
    this.localStorageService.setInLocalStorage({
      key: LASER_PREFERENCE_STORAGE_KEY,
      value: preference,
    });
  }

  protected updateGlobalFilter(value: string): void {
    this.globalFilter.set(value);
    if (this.filterDebounce) clearTimeout(this.filterDebounce);
    this.filterDebounce = setTimeout(() => this.loadBoard(), 300);
  }

  protected openPlanDetails(plan: LaserPlan): void {
    if (this.route.snapshot.paramMap.get('numPrograma') !== plan.numPrograma) {
      void this.router.navigate(['/prod-laser/producao/detail', plan.numPrograma]);
      return;
    }

    this.showPlanDetails(plan);
  }

  protected getPlanListTitle(plan: LaserPlan): string {
    return this.planColumns().find((column) => column.id === plan.listId)?.title ?? 'Lista não informada';
  }

  protected getSelectedPlanListTitle(): string {
    const plan = this.selectedPlan();
    return plan ? this.getPlanListTitle(plan) : '';
  }

  private showPlanDetails(plan: LaserPlan): void {
    this.selectedPlan.set(plan);
    this.programDetails.set([]);
    this.programDetailsError.set(null);
    this.programDetailsLoading.set(true);
    this.nestingPreview.set(null);
    this.nestingPreviewSvg.set(null);
    this.selectedDetailItem.set(null);
    this.nestingPreviewError.set(null);
    this.nestingLegendByItem.set(new Map());
    this.nestingPreviewLoading.set(true);
    const requestSequence = ++this.programDetailsRequestSequence;
    const previewRequestSequence = ++this.nestingPreviewRequestSequence;

    this.producaoFabricaApi.obterDetalhesDoPrograma(plan.numPrograma).subscribe({
      next: (details) => {
        if (requestSequence !== this.programDetailsRequestSequence) return;
        this.programDetails.set(this.applyNestingLegend(details));
      },
      error: (error) => {
        if (requestSequence !== this.programDetailsRequestSequence) return;
        this.programDetailsError.set(this.getErrorMessage(error));
        this.programDetailsLoading.set(false);
      },
      complete: () => {
        if (requestSequence === this.programDetailsRequestSequence) this.programDetailsLoading.set(false);
      },
    });

    this.producaoFabricaApi.gerarPreviewDoNesting(plan.numPrograma).subscribe({
      next: (response) => {
        if (previewRequestSequence !== this.nestingPreviewRequestSequence) return;
        const preview = this.toNestingPreviewUrl(response);
        const svg = this.findSvgContent(response);
        this.nestingPreviewSvg.set(svg?.includes('<svg') ? this.sanitizeSvg(svg) : null);
        this.nestingLegendByItem.set(this.extractNestingLegend(response));
        this.programDetails.update((details) => this.applyNestingLegend(details));
        if (preview) {
          this.nestingPreview.set(preview);
        } else {
          this.nestingPreviewError.set('O endpoint não retornou uma prévia SVG para este programa.');
        }
      },
      error: (error) => {
        if (previewRequestSequence !== this.nestingPreviewRequestSequence) return;
        this.nestingPreviewError.set(this.getErrorMessage(error));
        this.nestingPreviewLoading.set(false);
      },
      complete: () => {
        if (previewRequestSequence === this.nestingPreviewRequestSequence) this.nestingPreviewLoading.set(false);
      },
    });
  }

  protected closePlanDetails(visible: boolean): void {
    if (visible) return;
    this.selectedPlan.set(null);
    if (this.route.snapshot.paramMap.has('numPrograma')) {
      void this.router.navigate(['/prod-laser/producao']);
    }
  }

  /** Fecha a prévia e o diálogo pai juntos quando o usuário pressiona Escape. */
  protected closeDetailsOnEscape(event: KeyboardEvent): void {
    const imagePreviewOpen = document.querySelector('.p-image-mask .p-image-close-button') !== null;
    if (!this.selectedPlan() && !imagePreviewOpen) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.detailImages?.forEach((image) => {
      image.closePreview();
      // O PrimeNG mantém a máscara durante a animação. Como o diálogo pai
      // será desmontado na sequência, encerra ambos os estados explicitamente.
      image.previewVisible = false;
      image.maskVisible = false;
    });
    // O overlay do p-image é anexado ao body e pode não estar na árvore
    // consultada pelo componente enquanto a animação de abertura está ativa.
    // Acionar os botões reais de fechamento cobre esse estado também.
    document.querySelectorAll<HTMLElement>('.p-image-mask .p-image-close-button')
      .forEach((button) => button.click());
    document.querySelectorAll<HTMLElement>('.p-image-mask')
      .forEach((mask) => mask.remove());
    this.closePlanDetails(false);
  }

  private toNestingPreviewUrl(response: unknown): string | null {
    const svg = this.findSvgContent(response);
    if (!svg) return null;
    if (svg.startsWith('data:image/') || /^https?:\/\//.test(svg)) return svg;

    const bytes = new TextEncoder().encode(svg);
    let binary = '';
    for (let start = 0; start < bytes.length; start += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
    }
    return `data:image/svg+xml;base64,${btoa(binary)}`;
  }

  private findSvgContent(response: unknown): string | null {
    if (typeof response === 'string') return response.trim() || null;
    if (!response || typeof response !== 'object') return null;

    const values = Object.values(response as Record<string, unknown>);
    for (const value of values) {
      const svg = this.findSvgContent(value);
      if (svg?.includes('<svg') || svg?.startsWith('data:image/') || /^https?:\/\//.test(svg ?? '')) return svg;
    }
    return null;
  }

  private extractNestingLegend(response: unknown): Map<string, string> {
    if (!response || typeof response !== 'object') return new Map();
    const value = response as Record<string, unknown>;
    const legend = value['legend'] ?? value['legenda'];
    if (!Array.isArray(legend)) return new Map();

    return new Map(legend.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const item = (entry as Record<string, unknown>)['item'];
      const color = (entry as Record<string, unknown>)['color']
        ?? (entry as Record<string, unknown>)['cor'];
      if ((typeof item !== 'string' && typeof item !== 'number') || typeof color !== 'string' || !color.trim()) {
        return [];
      }
      return [[String(item).trim(), color.trim()] as [string, string]];
    }));
  }

  private sanitizeSvg(svg: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, svg) ?? '';
  }

  protected onNestingPreviewClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;

    let svgElement: Element | null = target;
    let color: string | null = null;
    while (svgElement) {
      const stroke = svgElement.getAttribute('stroke')?.trim();
      if (stroke && stroke.toLowerCase() !== 'none') {
        color = stroke;
        break;
      }
      svgElement = svgElement.parentElement;
    }
    if (!color) {
      svgElement = target;
      while (svgElement) {
        const fill = svgElement.getAttribute('fill')?.trim();
        if (fill && fill.toLowerCase() !== 'none') {
          color = fill;
          break;
        }
        svgElement = svgElement.parentElement;
      }
    }
    if (!color) return;

    const itemCode = this.findLegendItem(color);
    if (!itemCode) return;
    const detail = this.programDetails().find((entry) => this.getDetailItemCode(entry) === itemCode);
    if (!detail) return;

    this.selectedDetailItem.set(itemCode);
    const detailElement = document.getElementById(this.getDetailAnchorId(itemCode));
    if (!detailElement) return;
    requestAnimationFrame(() => detailElement.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  protected getDetailAnchorId(itemCode: string): string {
    return `program-detail-${itemCode.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  private findLegendItem(color: string): string | null {
    const normalizedColor = color.replace(/\s+/g, ' ').trim().toLowerCase();
    for (const [item, legendColor] of this.nestingLegendByItem()) {
      if (legendColor.replace(/\s+/g, ' ').trim().toLowerCase() === normalizedColor) return item;
    }
    return null;
  }

  private applyNestingLegend(details: ProgramaLaserDetalhe[]): ProgramaLaserDetalhe[] {
    const legend = this.nestingLegendByItem();
    if (!legend.size) return details;
    return details.map((detail) => ({
      ...detail,
      legenda: legend.get(this.getDetailItemCode(detail)) ?? detail.legenda,
    }));
  }

  protected loadMore(column: LaserPlanColumn): void {
    if (!column.pagination.hasMore || this.loadingListIds().has(column.id)) return;

    this.setListLoading(column.id, true);
    this.producaoFabricaApi.carregarCardsDaLista(
      column.id,
      column.pagination.page + 1,
      PAGE_SIZE,
      this.globalFilter().trim(),
    ).subscribe({
      next: (response) => {
        const pagination = this.toPagination(response, response.data.length);
        this.planColumns.update((columns) => columns.map((current) => current.id === column.id
          ? { ...current, plans: [...current.plans, ...response.data], pagination }
          : current));
      },
      error: (error) => {
        this.availablePlansError.set(this.getErrorMessage(error));
        this.setListLoading(column.id, false);
      },
      complete: () => this.setListLoading(column.id, false),
    });
  }

  protected async moveAllToAvailable(column: LaserPlanColumn, event: MouseEvent): Promise<void> {
    if (this.isLaserReadOnly() || column.kind !== 'machine' || this.bulkMovingListIds().has(column.id)) return;

    const target = event.currentTarget as HTMLElement;
    this.setBulkMoving(column.id, true);
    try {
      const cards = await this.loadAllCards(column.id);
      const movableCards = cards.filter((card) => card.movable);
      const blockedCards = cards.length - movableCards.length;

      if (!movableCards.length) {
        this.availablePlansError.set('Não há programas liberados para mover nesta máquina.');
        this.setBulkMoving(column.id, false);
        return;
      }

      const confirmation = `Mover ${movableCards.length} programa(s) para Programas disponíveis?${blockedCards ? ` ${blockedCards} bloqueado(s) permanecerá(ão) na máquina.` : ''}`;
      this.confirmationService.confirm({
        target,
        message: confirmation,
        icon: 'pi pi-exclamation-triangle',
        rejectButtonProps: {
          label: 'Cancelar',
          severity: 'secondary',
          outlined: true,
        },
        acceptButtonProps: {
          label: 'Mover programas',
          severity: 'warning',
        },
        accept: () => void this.moveCardsToAvailable(column, movableCards),
        reject: () => this.setBulkMoving(column.id, false),
      });
    } catch (error) {
      this.availablePlansError.set(this.getErrorMessage(error));
      this.setBulkMoving(column.id, false);
    }
  }

  /** Move todos os cartões disponíveis, agrupando-os por task. */
  protected async moveAvailableTasks(column: LaserPlanColumn, targetListId: string, taskIds: string[], event: Event, clearForm: () => void): Promise<void> {
    if (this.isLaserReadOnly() || column.kind !== 'available' || !targetListId || this.bulkMovingListIds().has(column.id)) return;

    const target = event.currentTarget as HTMLElement;
    this.setBulkMoving(column.id, true);
    try {
      const cardsByTask = await Promise.all(taskIds.map((taskId) => this.loadAllCards(column.id, taskId)));
      const cards = [...new Map(cardsByTask.flat().map((card) => [card.numPrograma, card])).values()];
      const movableCards = cards.filter((card) => this.canMoveCard(card, column.kind));
      if (!movableCards.length) {
        this.availablePlansError.set(`Não há cartões móveis para as tasks informadas nos programas disponíveis.`);
        this.setBulkMoving(column.id, false);
        return;
      }

      this.confirmationService.confirm({
        target,
        message: `Mover ${movableCards.length} programa(s) das ${taskIds.length} task(s) selecionadas para a lista escolhida? Cartões finalizados permanecerão intactos.`,
        icon: 'pi pi-exclamation-triangle',
        rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
        acceptButtonProps: { label: 'Mover tasks', severity: 'warning' },
        accept: async () => {
          await this.moveCardsToList(column, movableCards, targetListId);
          clearForm();
        },
        reject: () => this.setBulkMoving(column.id, false),
      });
    } catch (error) {
      this.availablePlansError.set(this.getErrorMessage(error));
      this.setBulkMoving(column.id, false);
    }
  }

  protected async prioritizeTask(column: LaserPlanColumn, taskId: string, event: Event): Promise<void> {
    if (this.isLaserReadOnly() || column.kind !== 'machine' || !taskId.trim() || this.bulkMovingListIds().has(column.id)) return;

    const normalizedTaskId = taskId.trim();
    const target = event.currentTarget as HTMLElement;
    this.setBulkMoving(column.id, true);
    try {
      const cards = await this.loadAllCards(column.id, normalizedTaskId);
      const taskCards = cards.filter((card) => !card.finished && this.getTaskId(card) === normalizedTaskId);
      if (!taskCards.length) {
        this.availablePlansError.set(`A task ${normalizedTaskId} não foi encontrada nesta máquina.`);
        this.setBulkMoving(column.id, false);
        return;
      }

      const taskCardNumbers = new Set(taskCards.map((card) => card.numPrograma));
      const orderedCards = [
        ...taskCards,
        ...cards.filter((card) => !taskCardNumbers.has(card.numPrograma)),
      ];
      this.confirmationService.confirm({
        target,
        message: `Levar ${taskCards.length} programa(s) da task ${normalizedTaskId} para o topo desta máquina?`,
        icon: 'pi pi-angle-double-up',
        rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
        acceptButtonProps: { label: 'Priorizar task', severity: 'warning' },
        accept: () => void this.reorderTaskToTop(column, orderedCards),
        reject: () => this.setBulkMoving(column.id, false),
      });
    } catch (error) {
      this.availablePlansError.set(this.getErrorMessage(error));
      this.setBulkMoving(column.id, false);
    }
  }

  private async reorderTaskToTop(column: LaserPlanColumn, cards: LaserPlan[]): Promise<void> {
    let failures = 0;
    try {
      for (const [priority, card] of cards.entries()) {
        try {
          await firstValueFrom(this.producaoFabricaApi.moverCard(card.numPrograma, {
            expectedListId: column.id,
            targetListId: column.id,
            priority,
          }));
        } catch {
          failures++;
        }
      }
      if (failures) this.availablePlansError.set(`${failures} programa(s) não puderam ter a prioridade atualizada.`);
    } catch (error) {
      this.availablePlansError.set(this.getErrorMessage(error));
    } finally {
      this.setBulkMoving(column.id, false);
      this.scheduleListsRefresh([column.id]);
    }
  }

  private async moveCardsToList(column: LaserPlanColumn, cards: LaserPlan[], targetListId: string): Promise<void> {
    let failures = 0;
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(4, cards.length) }, async () => {
      while (nextIndex < cards.length) {
        const card = cards[nextIndex++];
        try {
          await firstValueFrom(this.producaoFabricaApi.moverCard(card.numPrograma, {
            expectedListId: column.id,
            targetListId,
          }));
        } catch { failures++; }
      }
    });
    await Promise.all(workers);
    if (failures) this.availablePlansError.set(`${failures} programa(s) não puderam ser movidos.`);
    this.setBulkMoving(column.id, false);
    this.scheduleListsRefresh([column.id, targetListId]);
  }

  private async moveCardsToAvailable(column: LaserPlanColumn, movableCards: LaserPlan[]): Promise<void> {
    try {
      let failures = 0;
      let nextIndex = 0;
      const workers = Array.from({ length: Math.min(4, movableCards.length) }, async () => {
        while (nextIndex < movableCards.length) {
          const card = movableCards[nextIndex++];
          try {
            await firstValueFrom(this.producaoFabricaApi.moverCard(card.numPrograma, {
              expectedListId: column.id,
              targetListId: 'available',
            }));
          } catch {
            failures++;
          }
        }
      });
      await Promise.all(workers);

      if (failures) {
        this.availablePlansError.set(`${failures} programa(s) não puderam ser movidos e foram mantidos na lista atual.`);
      }
    } catch (error) {
      this.availablePlansError.set(this.getErrorMessage(error));
    } finally {
      this.setBulkMoving(column.id, false);
      this.scheduleListsRefresh([column.id, 'available']);
    }
  }

  protected onPlanDropped(event: CdkDragDrop<LaserPlan[]>): void {
    if (this.isLaserReadOnly()) return;
    const sourceListId = event.previousContainer.id;
    const targetListId = event.container.id;
    const plan = event.previousContainer.data[event.previousIndex];
    const source = this.findColumn(sourceListId);
    const target = this.findColumn(targetListId);

    if (!plan || !source || !target || !this.canMove(plan, source, target)) {
      this.reloadLists([sourceListId, targetListId]);
      return;
    }

    // O CDK informa o movimento, mas a alteração dos arrays é responsabilidade
    // da aplicação. Para a mesma lista, é necessário reordenar o próprio array;
    // transferArrayItem é destinado a listas distintas.
    if (sourceListId === targetListId) {
      if (event.previousIndex === event.currentIndex) return;
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    plan.listId = targetListId;
    this.updateMachinePriorities(source, target);
    plan.isMoving = true;
    this.planColumns.update((columns) => [...columns]);

    const payload: MoveLaserBoardCardDto = {
      expectedListId: sourceListId,
      targetListId,
      ...(target.kind === 'machine' ? { priority: event.currentIndex } : {}),
    };

    this.producaoFabricaApi.moverCard(plan.numPrograma, payload).subscribe({
      next: () => {
        plan.isMoving = false;
        this.planColumns.update((columns) => [...columns]);
        this.scheduleListsRefresh([sourceListId, targetListId]);
      },
      error: (error) => {
        plan.isMoving = false;
        this.availablePlansError.set(this.getErrorMessage(error));
        this.scheduleListsRefresh([sourceListId, targetListId]);
      },
    });
  }

  protected isListLoading(listId: string): boolean {
    return this.loadingListIds().has(listId);
  }

  protected isBulkMoving(listId: string): boolean {
    return this.bulkMovingListIds().has(listId);
  }

  protected formatDetailValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return 'Não informado';
    if (typeof value !== 'object') return String(value);
    return JSON.stringify(value);
  }

  protected getDetailItemCode(detail: ProgramaLaserDetalhe): string {
    const value = detail.codItem;
    if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const candidate = record['partcode'] ?? record['codItem'] ?? record['codigo'] ?? record['id'];
      if (typeof candidate === 'string' || typeof candidate === 'number') return String(candidate).trim();
    }
    return '';
  }

  protected getLegendaColor(detail: ProgramaLaserDetalhe): string | null {
    const legenda = detail.legenda as unknown;
    if (typeof legenda === 'string' && legenda.trim()) return legenda.trim();
    if (legenda && typeof legenda === 'object') {
      const color = (legenda as Record<string, unknown>)['cor']
        ?? (legenda as Record<string, unknown>)['color'];
      if (typeof color === 'string' && color.trim()) return color.trim();
    }
    return null;
  }

  private createDetailPlan(numPrograma: string): LaserPlan {
    return {
      numPrograma,
      statusRegistro: '',
      // No acesso direto à rota, os dados do cartão ainda não foram carregados.
      datImport: undefined!,
      taskId: null,
      postProcessor: null,
      listId: '',
      finished: false,
      hasStartedProduction: false,
      isInProduction: false,
      movable: false,
    };
  }

  protected getItemImage(itemCode: string): string {
    return this.partcodeImageService.pictureRenderLink({ partcode: itemCode });
  }


  private loadBoard(): void {
    const requestSequence = ++this.boardRequestSequence;
    this.availablePlansLoading.set(true);
    this.availablePlansError.set(null);
    this.producaoFabricaApi.carregarQuadro(PAGE_SIZE, this.globalFilter().trim()).subscribe({
      next: (board) => {
        if (requestSequence !== this.boardRequestSequence) return;
        this.applyBoard(board, requestSequence);
        this.availablePlansLoading.set(false);
      },
      error: (error) => {
        if (requestSequence !== this.boardRequestSequence) return;
        this.availablePlansError.set(this.getErrorMessage(error));
        this.availablePlansLoading.set(false);
      },
    });
  }

  private loadLaserPreference(): void {
    const storedPreference = this.localStorageService.getInLocalStorage(LASER_PREFERENCE_STORAGE_KEY);
    if (storedPreference === 'BYSTRONIC' || storedPreference === 'LVD') {
      this.laserPreference.set(storedPreference);
    }
  }

  private applyBoard(board: LaserBoardDto, requestSequence: number): void {
    if (requestSequence !== this.boardRequestSequence) return;
    this.planColumns.set(board.lists.map((list) => this.toColumn(list)));
    const selectedPlan = this.selectedPlan();
    if (selectedPlan) {
      const refreshedPlan = board.lists
        .flatMap((list) => list.cards)
        .find((card) => card.numPrograma === selectedPlan.numPrograma);
      if (refreshedPlan) this.selectedPlan.set({ ...refreshedPlan });
    }
    this.lastUpdated.set(`Hoje, ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
  }

  private reloadLists(listIds: string[], animateSseChanges = false): void {
    [...new Set(listIds)].forEach((listId) => {
      const column = this.findColumn(listId);
      if (!column) return;
      const currentCards = new Map(column.plans.map((card) => [card.numPrograma, card]));

      this.producaoFabricaApi.carregarCardsDaLista(listId, 0, PAGE_SIZE, this.globalFilter().trim()).subscribe({
        next: (response) => {
          const pagination = this.toPagination(response, response.data.length);
          const plans = response.data.map((card) => ({
            ...card,
            sseUpdated: animateSseChanges && this.isSseVisualChange(card, currentCards.get(card.numPrograma)),
          }));
          this.planColumns.update((columns) => columns.map((current) => current.id === listId
            ? { ...current, plans, pagination }
            : current));
          if (plans.some((card) => card.sseUpdated)) this.clearSseHighlights();
        },
        error: (error) => this.availablePlansError.set(this.getErrorMessage(error)),
      });
    });
  }

  private syncListsFromEvent(): void {
    // Um card pode ter saído da lista de origem (por exemplo, "Disponíveis")
    // mesmo quando o SSE identifica apenas as listas de máquinas/finalizados.
    // Recarregar todas as listas visíveis mantém as colunas consistentes.
    this.scheduleListsRefresh(this.planColumns().map((column) => column.id), true);
  }

  private scheduleListsRefresh(listIds: string[], fromSse = false): void {
    [...new Set(listIds)].forEach((listId) => {
      if (fromSse) this.sseRefreshListIds.add(listId);
      const previousTimer = this.listRefreshTimers.get(listId);
      if (previousTimer) clearTimeout(previousTimer);

      const timer = setTimeout(() => {
        this.listRefreshTimers.delete(listId);
        this.reloadLists([listId], this.sseRefreshListIds.delete(listId));
      }, 700);
      this.listRefreshTimers.set(listId, timer);
    });
  }

  private isSseVisualChange(next: LaserPlan, previous?: LaserPlan): boolean {
    return !previous
      || previous.priority !== next.priority
      || previous.hasStartedProduction !== next.hasStartedProduction
      || previous.isInProduction !== next.isInProduction
      || previous.finished !== next.finished
      || previous.statusRegistro !== next.statusRegistro;
  }

  private clearSseHighlights(): void {
    if (this.sseAnimationTimer) clearTimeout(this.sseAnimationTimer);
    this.sseAnimationTimer = setTimeout(() => {
      this.planColumns.update((columns) => columns.map((column) => ({
        ...column,
        plans: column.plans.map((plan) => plan.sseUpdated ? { ...plan, sseUpdated: false } : plan),
      })));
    }, 1400);
  }

  private toColumn(list: LaserBoardListDto): LaserPlanColumn {
    const kind = list.kind as LaserPlanColumnKind;
    return {
      id: list.id,
      title: list.title,
      description: this.getColumnDescription(kind),
      kind,
      plans: list.cards,
      pagination: this.toPagination(list.pagination, list.cards.length),
      accent: kind === 'finished' ? 'done' : kind === 'machine' ? 'pending' : 'available',
    };
  }

  private isListVisible(column: LaserPlanColumn): boolean {
    if (this.isLaserReadOnly() && column.kind !== 'machine') return false;

    const preference = this.laserPreference();
    if (preference === 'ALL' || column.kind !== 'machine') return true;

    const searchableName = `${column.id} ${column.title}`.toUpperCase();
    return searchableName.includes(preference);
  }

  private toPagination(value: object, itemCount: number): LaserPlanPagination {
    const pagination = value as Partial<Omit<LaserPlanPagination, 'hasMore'>> & { hasMore?: boolean };
    const page = pagination.page ?? 0;
    const limit = pagination.limit ?? PAGE_SIZE;
    const total = pagination.total ?? itemCount;
    const totalPages = pagination.totalPages ?? Math.ceil(total / limit);
    return { total, page, limit, totalPages, hasMore: pagination.hasMore ?? page + 1 < totalPages };
  }

  private canMove(plan: LaserPlan, source: LaserPlanColumn, target: LaserPlanColumn): boolean {
    return this.canMoveCard(plan, source.kind)
      && ((source.id === target.id && source.kind === 'machine')
        || (source.kind === 'available' && target.kind === 'machine')
        || (source.kind === 'machine' && target.kind === 'available')
        || (source.kind === 'machine' && target.kind === 'machine'));
  }

  private canMoveCard(plan: LaserPlan, sourceKind: LaserPlanColumnKind): boolean {
    return !plan.finished
      && (plan.movable || (sourceKind === 'available' && plan.isInProduction));
  }

  protected getTaskId(plan: LaserPlan): string | null {
    const taskId = plan.taskId as unknown;
    if (typeof taskId === 'string' || typeof taskId === 'number') return String(taskId);
    if (!taskId || typeof taskId !== 'object') return null;
    const value = taskId as Record<string, unknown>;
    const identifier = value['taskId'] ?? value['task'] ?? value['id'] ?? value['name'];
    return typeof identifier === 'string' || typeof identifier === 'number' ? String(identifier) : null;
  }

  private updateMachinePriorities(source: LaserPlanColumn, target: LaserPlanColumn): void {
    [source, target]
      .filter((column, index, columns) => column.kind === 'machine' && columns.indexOf(column) === index)
      .forEach((column) => column.plans.forEach((card, index) => card.priority = index));
  }

  private findColumn(id: string): LaserPlanColumn | undefined {
    return this.planColumns().find((column) => column.id === id);
  }

  private setListLoading(listId: string, loading: boolean): void {
    this.loadingListIds.update((ids) => {
      const updated = new Set(ids);
      loading ? updated.add(listId) : updated.delete(listId);
      return updated;
    });
  }

  private async loadAllCards(listId: string, search?: string): Promise<LaserPlan[]> {
    const firstPage = await firstValueFrom(this.producaoFabricaApi.carregarCardsDaLista(listId, 0, 100, search));
    const cards = [...firstPage.data] as LaserPlan[];
    for (let page = 1; page < firstPage.totalPages; page++) {
      const response = await firstValueFrom(this.producaoFabricaApi.carregarCardsDaLista(listId, page, 100, search));
      cards.push(...response.data);
    }
    return cards;
  }

  private setBulkMoving(listId: string, moving: boolean): void {
    this.bulkMovingListIds.update((ids) => {
      const updated = new Set(ids);
      moving ? updated.add(listId) : updated.delete(listId);
      return updated;
    });
  }

  private getColumnDescription(kind: LaserPlanColumnKind): string {
    if (kind === 'machine') return 'Programas alocados para esta máquina';
    if (kind === 'finished') return 'Cortes concluídos no turno';
    return 'Prontos para serem direcionados';
  }

  private getErrorMessage(error: unknown): string {
    const value = error as { response?: { data?: { message?: string | string[] } }; message?: string };
    const message = value.response?.data?.message ?? value.message;
    return Array.isArray(message) ? message[0] : message || 'Não foi possível atualizar o quadro de produção.';
  }
}
