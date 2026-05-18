import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class CacheService {

  private storage: Storage;

  constructor() {
    this.storage = window.localStorage;
  }

  set<T>(key: string, value: T): boolean {
    if (this.storage) {
      this.storage.setItem(key, JSON.stringify(value));
      return true;
    }
    return false;
  }

  get<T>(key: string): T | undefined {
    if (this.storage) {
      const value = this.storage.getItem(key);
      if(!value) return undefined
      return JSON.parse(value);
    }
    return undefined;
  }

  remove(key: string): boolean {
    if (this.storage) {
      this.storage.removeItem(key);
      return true;
    }
    return false;
  }

  clear(): boolean {
    if (this.storage) {
      this.storage.clear();
      return true;
    }
    return false;
  }

}