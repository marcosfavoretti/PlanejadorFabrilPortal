import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ResSetorDTO } from '../../api/buffer';

@Injectable({
  providedIn: 'root'
})
export class SetorStoreService {
  private readonly _currentSetorSource = new BehaviorSubject<ResSetorDTO | null>(null);
  readonly currentSetor$ = this._currentSetorSource.asObservable();

  get currentSetor(): ResSetorDTO | null {
    return this._currentSetorSource.getValue();
  }

  set currentSetor(setor: ResSetorDTO | null) {
    this._currentSetorSource.next(setor);
  }
}
