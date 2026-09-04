import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { LaserPlan } from '../../models/laser-plan.model';

@Component({
  selector: 'app-laser-plan-card',
  standalone: true,
  imports: [CommonModule, CdkDrag, BadgeModule, TagModule],
  templateUrl: './laser-plan-card.component.html',
  styleUrl: './laser-plan-card.component.css',
})
export class LaserPlanCardComponent {
  readonly plan = input.required<LaserPlan>();
  readonly accent = input.required<string>();
  readonly draggable = input(false);
  readonly detailsRequested = output<LaserPlan>();
  protected readonly copiedValue = signal<string | null>(null);

  protected getTaskId(): string | null {
    const taskId = this.plan().taskId as unknown;
    if (typeof taskId === 'string' || typeof taskId === 'number') return String(taskId);
    if (!taskId || typeof taskId !== 'object') return null;

    const value = taskId as Record<string, unknown>;
    const identifier = value['taskId'] ?? value['task'] ?? value['id'] ?? value['name'];
    return typeof identifier === 'string' || typeof identifier === 'number' ? String(identifier) : null;
  }

  protected getPostProcessorSeverity(): 'success' | 'info' | 'secondary' {
    if (this.plan().postProcessor === 'BYSTRONIC') return 'info';
    if (this.plan().postProcessor === 'LVD') return 'success';
    return 'secondary';
  }

  protected async copyValue(event: MouseEvent, value: string): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
      this.copiedValue.set(value);
      window.setTimeout(() => {
        if (this.copiedValue() === value) this.copiedValue.set(null);
      }, 1600);
    } catch {
      this.copiedValue.set(null);
    }
  }
}
