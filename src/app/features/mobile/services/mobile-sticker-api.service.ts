import {
  MobileEtiquetasControllerListarEtiquetasPdiQueryParams,
  PaginatedStickersPdiPendentesResDto,
  PdiOrderOpeningRes,
  mobileEtiquetasControllerBuscarAberturaEtiquetaPdi,
  mobileEtiquetasControllerListarEtiquetasPdi,
} from '@/api/mobile';
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MobileStickerApiService {
  listarEtiquetasPdi(
    params: MobileEtiquetasControllerListarEtiquetasPdiQueryParams,
  ): Observable<PaginatedStickersPdiPendentesResDto> {
    return from(
      mobileEtiquetasControllerListarEtiquetasPdi(params, {
        headers: {
          // A lista muda quando uma etiqueta é reportada. Não reutilizar uma
          // resposta GET antiga do navegador ou de um proxy intermediário.
          'Cache-Control': 'no-cache, no-store',
          Pragma: 'no-cache',
        },
      }),
    );
  }

  buscarAberturaEtiquetaPdi(id: number): Observable<PdiOrderOpeningRes> {
    return from(mobileEtiquetasControllerBuscarAberturaEtiquetaPdi(id));
  }
}
