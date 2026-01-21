// shared/store/signal-store.ts
import { GlobalFilterInputText } from '@/app/services/GlobalInputText.service';
import { signal, WritableSignal, computed, effect, inject } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';

export abstract class SignalStore<T> {
  initialized: boolean = false;
  globalFilterInputText = inject(GlobalFilterInputText);
  protected readonly _item: WritableSignal<T | null> = signal<T | null>(null);
  readonly item = this._item.asReadonly();
  protected _original: T | null = null; // guarda os dados originais
  filterApplied: boolean = false;

  globalInputFilterChange = effect(
    () => {
      this.triggerFilter();
    }
  )

  triggerFilter() {
    const signal = this.globalFilterInputText.getTextSignal();
    this.onGlobalInputFilterApplied(signal());
  }

  get(): T | null {
    return this._item();
  }

  set(value: T): void {
    this._original = value;
    this._item.set(value);
    if (this.filterApplied) {
      this.triggerFilter();
    }
  }

  clear(): void {
    this._item.set(null);
  }


  resetStore(): void {
    this.initialized = false;
    this._original = null;
    this.clear();
  }

  initialize(props?: unknown): Observable<unknown> {
    if (!this.initialized) {
      this.initialized = true;
      return this.refresh(props);
    }
    return EMPTY;
  }


  onGlobalInputFilterApplied(filter: string | undefined): void {
    this.filterApplied = true
    if (!this._original) return;

    if (!Array.isArray(this._original)) {
      this._item.set(this._original);
      this.filterApplied = false;
      return;
    }

    if (!filter) {
      this._item.set(this._original);
      this.filterApplied = false;
      return;
    }

    const filtered = this._original.filter(i =>
      JSON.stringify(i).toLowerCase().includes(filter.toLowerCase())
    );

    this._item.set(filtered as unknown as T);
  }

  abstract refresh(props: unknown): Observable<unknown>;

  readonly isSet = computed(() => this._item() !== null);
}
