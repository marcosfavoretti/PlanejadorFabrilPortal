import { signal, WritableSignal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';

export abstract class SignalStore<T> {
  initialized: boolean = false;
  protected readonly _item: WritableSignal<T | null> = signal<T | null>(null);
  readonly item = this._item.asReadonly();

  get(): T | null {
    return this._item();
  }

  set(value: T): void {
    this._item.set(value);
  }

  clear(): void {
    this._item.set(null);
  }


  resetStore(): void {
    this.initialized = false;
    this.clear();
  }

  initialize(props?: unknown): Observable<unknown> {
    if (!this.initialized || this.get() === null) {
      this.initialized = true;
      return this.refresh(props);
    }
    return of(this.get());
  }

  abstract refresh(props?: unknown): Observable<unknown>;

  readonly isSet = computed(() => this._item() !== null);
}
