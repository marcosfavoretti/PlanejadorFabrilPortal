import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CabinometroApiService } from '../../services/cabinometro-api.service';
import { Subscription, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-cabinometro-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cabinometro-page.component.html',
  styleUrl: './cabinometro-page.component.css'
})
export class CabinometroPageComponent implements OnInit, OnDestroy {
  private readonly cabinometroApi = inject(CabinometroApiService);
  private sub?: Subscription;

  currentCounter: number = 0;
  displayCounter: number = 0;
  
  private animationFrameId?: number;

  ngOnInit(): void {
    // Poll the API every 10 seconds for real-time updates
    this.sub = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.cabinometroApi.getCounter())
    ).subscribe({
      next: (res) => {
        if (res && res.current_counter !== undefined) {
          this.animateCounter(res.current_counter);
        }
      },
      error: (err) => {
        console.error('Failed to fetch cabinometro counter', err);
      }
    });
  }

  animateCounter(target: number): void {
    if (this.currentCounter === target && this.displayCounter === target) return;
    
    const start = this.displayCounter;
    const end = target;
    const duration = 2000; // 2 seconds animation
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out quart
      const easeOut = 1 - Math.pow(1 - progress, 4);
      
      this.displayCounter = Math.floor(start + (end - start) * easeOut);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.displayCounter = end;
        this.currentCounter = end;
      }
    };

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
