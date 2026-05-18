import { SignalStore } from './SignalStore.abstract';
import { Observable, of } from 'rxjs';

class TestSignalStore extends SignalStore<string> {
  refreshCalls: unknown[] = [];

  override refresh(props?: unknown): Observable<unknown> {
    this.refreshCalls.push(props);
    this.set('loaded');
    return of(this.get());
  }
}

describe('SignalStore', () => {
  it('initializes only once until reset', () => {
    const store = new TestSignalStore();

    store.initialize('first').subscribe();
    store.initialize('second').subscribe();

    expect(store.refreshCalls).toEqual(['first']);
    expect(store.get()).toBe('loaded');
  });

  it('resetStore clears state and initialization flag', () => {
    const store = new TestSignalStore();

    store.initialize('first').subscribe();
    store.resetStore();

    expect(store.initialized).toBeFalse();
    expect(store.get()).toBeNull();
    expect(store.isSet()).toBeFalse();
  });
});
