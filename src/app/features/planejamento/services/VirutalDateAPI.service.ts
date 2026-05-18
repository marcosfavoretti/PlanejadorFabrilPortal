import { from, Observable } from "rxjs"
import { virtualDateControllerConsultDateMethod, VirtualDateControllerConsultDateMethod200, virtualDateControllerHandleDateMethod, VirtualDateControllerHandleDateMethod200, VirtualDateControllerHandleDateMethodPathParamsParamEnum } from "../../api"
import { Injectable } from "@angular/core"

@Injectable({providedIn: 'root'})
export class VirtaulDateAPIService {
    requestHandle(dto: VirtualDateControllerHandleDateMethodPathParamsParamEnum): Observable<VirtualDateControllerHandleDateMethod200> {
        return from(
            virtualDateControllerHandleDateMethod(dto)
                .then((d) => d)
                .catch(err => { throw err })
        )
    }

    requestCurrent(): Observable<VirtualDateControllerConsultDateMethod200> {
        return from(
            virtualDateControllerConsultDateMethod()
                .then((d) => d)
                .catch(err => { throw err })
        )
    }
}