// shared/store/signal-store.ts
import { signal, WritableSignal, computed } from '@angular/core';

export abstract class SignalStore<T> {
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

  readonly isSet = computed(() => this._item() !== null);
}
