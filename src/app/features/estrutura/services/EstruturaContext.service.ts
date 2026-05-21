import { Injectable, signal, computed } from '@angular/core';

const ESTRUTURA_PARTCODE_STORAGE_KEY = 'estrutura.context.partcode';

@Injectable({
  providedIn: 'root'
})
export class EstruturaContextService {
  private _partcode = signal<string | null>(this.loadFromStorage());
  private _tag = signal<string | null>(this.loadTagFromStorage());

  readonly partcode = this._partcode.asReadonly();
  readonly tag = this._tag.asReadonly();

  private loadFromStorage(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const value = localStorage.getItem(ESTRUTURA_PARTCODE_STORAGE_KEY)?.trim().toUpperCase();
    return value || null;
  }

  private loadTagFromStorage(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const value = localStorage.getItem('estrutura.context.tag')?.trim().toLowerCase();
    return value || null;
  }

  getPartcode(): string | null {
    return this._partcode();
  }

  getTag(): string | null {
    return this._tag();
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

  setTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag) {
      return;
    }

    this._tag.set(normalizedTag);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('estrutura.context.tag', normalizedTag);
    }
  }

  clearPartcode(): void {
    this._partcode.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ESTRUTURA_PARTCODE_STORAGE_KEY);
    }
  }

  clearTag(): void {
    this._tag.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('estrutura.context.tag');
    }
  }
}
