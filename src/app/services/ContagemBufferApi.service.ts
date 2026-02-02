import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { bufferControllerSaveBufferLog, excelControllerCompactBuffer2ExcelMethod, ResBufferHistoricoDto, ResMercadosIntermediarioDoSetorDTO, ResSetorDTO, SaveBufferLogDto, setoresControllerGetSetoresMethod, setoresControllerGetSetorMercadoMethod } from '../../api/buffer';

@Injectable({
  providedIn: 'root'
})
export class ContagemBufferApiService {

  constructor() { }

  requestSetores(): Observable<ResSetorDTO[]> {
    return from(
      setoresControllerGetSetoresMethod()
        .then(response => {
          return response;
        })
    )
  }

  requestMercadoInfo(setorId: number, dia: string): Observable<ResMercadosIntermediarioDoSetorDTO[]> {
    return from(
      setoresControllerGetSetorMercadoMethod(setorId, dia)
        .then(response => {
          return response;
        })
    )
  }

  saveLog(payload: SaveBufferLogDto): Observable<ResBufferHistoricoDto> {
    return from(
      bufferControllerSaveBufferLog(payload)
        .then(response => {
          return response;
        }))
  }

  exportExcel(): Observable<void> {
    return from(
      excelControllerCompactBuffer2ExcelMethod()
        .then(response => {
          return response;
        }))
  }
}
