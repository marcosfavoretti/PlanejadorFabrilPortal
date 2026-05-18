import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  getInLocalStorage(key: string): string | null {
    const result = localStorage.getItem(key);
    return result;
  }

  setInLocalStorage({ key, value }: { key: string, value: string }): void {
    if(!key || !value) throw new Error('a funcao foi chamada sem algum dos parametros necessarios');
    localStorage.setItem(key, value);
  }
}
