import { GerarCodigoWifiDTO, SolicitarCodigoWifiDTO, wifiEthosControllerCheckarMagicLinkMethod, wifiEthosControllerGerarCodigoWifiMethod, wifiEthosControllerSolicitarCodigoWifi } from "@/api/wifi";
import { Injectable } from "@angular/core";
import { from, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class WifiAPIService {
    solicitarWifiCode(props: SolicitarCodigoWifiDTO): Observable<string> {
        return from(
            wifiEthosControllerSolicitarCodigoWifi(props)
                .then(data => data as string)
                .catch(err => {
                    throw err;
                })
        )
    }

    checkMagicLink(id: string): Observable<void> {
        return from(
            wifiEthosControllerCheckarMagicLinkMethod(id)
                .then(data => data)
                .catch(err => {
                    throw err;
                })
        )
    }

    criarWifiCode(id: string, props: GerarCodigoWifiDTO): Observable<string> {
        return from(
            wifiEthosControllerGerarCodigoWifiMethod(id, props)
                .then(data => data as string)
                .catch(err => { throw err })
        )
    }
}