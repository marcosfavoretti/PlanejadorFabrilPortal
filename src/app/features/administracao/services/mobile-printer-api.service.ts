import {
  ImpressoraBluetoothCreateDto,
  ImpressoraBluetoothResponseDto,
  mobileImpressoraBluetoothControllerCreate,
  mobileImpressoraBluetoothControllerDelete,
  mobileImpressoraBluetoothControllerFindAll,
  mobileImpressoraBluetoothControllerFindOne,
} from '@/api/mobile';
import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MobilePrinterApiService {
  createPrinter(dto: ImpressoraBluetoothCreateDto): Observable<ImpressoraBluetoothResponseDto> {
    return from(mobileImpressoraBluetoothControllerCreate(dto));
  }

  listPrinters(): Observable<ImpressoraBluetoothResponseDto[]> {
    return from(mobileImpressoraBluetoothControllerFindAll()).pipe(
      map((response) => this.normalizePrintersResponse(response))
    );
  }

  getPrinterById(id: string): Observable<ImpressoraBluetoothResponseDto> {
    return from(mobileImpressoraBluetoothControllerFindOne(id));
  }

  deletePrinter(id: string): Observable<void> {
    return from(mobileImpressoraBluetoothControllerDelete(id));
  }

  private normalizePrintersResponse(response: unknown): ImpressoraBluetoothResponseDto[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (typeof response === 'string' && response.includes('<!doctype html>')) {
      console.error('MobilePrinterApiService: gateway retornou HTML no endpoint de impressoras Bluetooth.', response);
      return [];
    }

    console.error('MobilePrinterApiService: resposta inválida no endpoint de impressoras Bluetooth.', response);
    return [];
  }
}
