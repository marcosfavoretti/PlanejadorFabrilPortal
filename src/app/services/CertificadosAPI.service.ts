import { certificadosCatControllerConsultarCertificados, CertificadosCatControllerConsultarCertificadosQueryParams, certificadosCatControllerProcessarCertificado, certificadosCatControllerRetornaArquivoCertificadoTxt, PaginatedResCertificadosDtoDto } from "@/api/certificados";
import { Injectable } from "@angular/core";
import { from, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class CertificadosAPIService {
    consultarCertificados(payload?: CertificadosCatControllerConsultarCertificadosQueryParams):
        Observable<PaginatedResCertificadosDtoDto> {
        return from(
            certificadosCatControllerConsultarCertificados(
                payload
            )
        )
    }

    dowloadTxtCertificado(id: string): Observable<Blob> {
        return from(
            (
                certificadosCatControllerRetornaArquivoCertificadoTxt(
                    id
                )
            )
        );
    }
}