import { Injectable, signal, computed } from '@angular/core';

const ESTRUTURA_PARTCODE_STORAGE_KEY = 'estrutura.context.partcode';

@Injectable({
  providedIn: 'root'
})
export class EstruturaContextService {
  private _partcode = signal<string | null>(this.loadFromStorage());

  readonly partcode = this._partcode.asReadonly();

  private loadFromStorage(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const value = localStorage.getItem(ESTRUTURA_PARTCODE_STORAGE_KEY)?.trim().toUpperCase();
    return value || null;
  }

  getPartcode(): string | null {
    return this._partcode();
  }

  setPartcode(partcode: string): void {
    const normalizedPartcode = partcode.trim().toUpperCase();
    if (!normalizedPartcode) {
      return;
    }

    this._partcode.set(normalizedPartcode);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ESTRUTURA_PARTCODE_STORAGE_KEY, normalizedPartcode);
    }
  }

  clearPartcode(): void {
    this._partcode.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ESTRUTURA_PARTCODE_STORAGE_KEY);
    }
  }
}
