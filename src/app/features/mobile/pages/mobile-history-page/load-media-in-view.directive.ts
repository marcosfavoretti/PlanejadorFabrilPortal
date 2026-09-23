import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appLoadMediaInView]',
  standalone: true,
})
export class LoadMediaInViewDirective implements AfterViewInit, OnDestroy {
  private readonly element = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  @Output() readonly mediaInView = new EventEmitter<void>();

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.mediaInView.emit();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.mediaInView.emit();
          this.observer?.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    this.observer.observe(this.element.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
