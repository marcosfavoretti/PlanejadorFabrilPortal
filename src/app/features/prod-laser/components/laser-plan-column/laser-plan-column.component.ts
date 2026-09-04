import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { CdkDrag, CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { LaserPlan } from '../../models/laser-plan.model';
import { LaserPlanCardComponent } from '../laser-plan-card/laser-plan-card.component';

@Component({
  selector: 'app-laser-plan-column',
  standalone: true,
  imports: [CommonModule, CdkDropList, LaserPlanCardComponent],
  templateUrl: './laser-plan-column.component.html',
  styleUrl: './laser-plan-column.component.css',
})
export class LaserPlanColumnComponent {
  readonly id = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly plans = input.required<LaserPlan[]>();
  readonly total = input.required<number>();
  readonly kind = input.required<'available' | 'machine' | 'finished'>();
  readonly draggable = input(false);
  readonly dropEnabled = input(true);
  readonly hasMore = input(false);
  readonly loadingMore = input(false);
  readonly bulkMoving = input(false);
  readonly readOnly = input(false);
  readonly accent = input.required<string>();
  readonly connectedTo = input.required<string[]>();
  readonly planDropped = output<CdkDragDrop<LaserPlan[]>>();
  readonly loadMore = output<void>();
  readonly planDetailsRequested = output<LaserPlan>();
  readonly moveAllToAvailable = output<MouseEvent>();
  readonly prioritizeTask = output<{ taskId: string; event: Event }>();
  readonly moveTasksToList = output<{ targetListId: string; taskIds: string[]; event: Event; clearForm: () => void }>();
  readonly targetLists = input<ReadonlyArray<{ id: string; title: string }>>([]);
  protected readonly taskDraft = signal('');
  protected readonly selectedTargetListId = signal('');
  private readonly loadMoreTrigger = viewChild<ElementRef<HTMLElement>>('loadMoreTrigger');

  constructor() {
    effect((onCleanup) => {
      const trigger = this.loadMoreTrigger()?.nativeElement;
      if (!trigger || !this.hasMore() || typeof IntersectionObserver === 'undefined') return;

      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !this.loadingMore()) {
          this.loadMore.emit();
        }
      }, { rootMargin: '0px 0px 200px' });

      observer.observe(trigger);
      onCleanup(() => observer.disconnect());
    });
  }

  protected readonly canEnter = (drag: CdkDrag<LaserPlan>, _drop: CdkDropList): boolean => {
    const plan = drag.data;
    return Boolean(
      this.dropEnabled()
      && !plan?.finished
      && (plan?.movable || (plan?.isInProduction && plan?.listId === 'available'))
    );
  };

  protected readonly selectedTaskIds = signal<string[]>([]);
  protected readonly priorityTaskDraft = signal('');

  protected addTask(taskId: string, event: Event): void {
    event.preventDefault();
    const normalizedTask = taskId.trim();
    if (!normalizedTask || this.bulkMoving()) return;
    this.selectedTaskIds.update((tasks) => tasks.includes(normalizedTask)
      ? tasks
      : [...tasks, normalizedTask]);
    this.taskDraft.set('');
  }

  protected removeTask(taskId: string): void {
    if (this.bulkMoving()) return;
    this.selectedTaskIds.update((tasks) => tasks.filter((task) => task !== taskId));
  }

  protected clearTaskForm(): void {
    this.selectedTaskIds.set([]);
    this.taskDraft.set('');
    this.selectedTargetListId.set('');
  }

  protected submitTaskMove(event: Event): void {
    event.preventDefault();
    const normalizedCurrentTask = this.taskDraft().trim();
    const taskIds = normalizedCurrentTask && !this.selectedTaskIds().includes(normalizedCurrentTask)
      ? [...this.selectedTaskIds(), normalizedCurrentTask]
      : this.selectedTaskIds();
    const targetListId = this.selectedTargetListId();
    if (!targetListId || !taskIds.length || this.bulkMoving()) return;
    this.moveTasksToList.emit({ targetListId, taskIds, event, clearForm: () => this.clearTaskForm() });
  }

  protected submitTaskPriority(event: Event): void {
    event.preventDefault();
    const taskId = this.priorityTaskDraft().trim();
    if (!taskId || this.bulkMoving()) return;
    this.prioritizeTask.emit({ taskId, event });
    this.priorityTaskDraft.set('');
  }
}
