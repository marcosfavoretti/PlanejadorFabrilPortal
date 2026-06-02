import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CabinometroResponse {
  current_counter: number;
}

@Injectable({
  providedIn: 'root'
})
export class CabinometroApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://app.ethos.ind.br/api/count-cabs';

  getCounter(): Observable<CabinometroResponse> {
    return this.http.get<CabinometroResponse>(this.apiUrl);
  }
}
