import { AdicionarPlanejamentoDTO, AtualizarPlanejamentoDTO, ConsutlarFabricaDTO, fabricaControllerAtualizarPlanejamentoMethod, fabricaControllerConsultaFabricaMethod, FabricaControllerConsultaFabricaMethodQueryParams, fabricaControllerConsultaFabricaPrincipalMethod, fabricaControllerConsultaPlanejamentosMethod, FabricaControllerConsultaPlanejamentosMethodQueryParams, fabricaControllerConsultarPedidosPlanejadosMethod, FabricaControllerConsultarPedidosPlanejadosMethodQueryParams, fabricaControllerConsutlarFabricasDoUsuarioUseCaseMethod, fabricaControllerDeletarFabricaMethod, fabricaControllerDesplanejarPedidoNaFabricaMethod, FabricaControllerDesplanejarPedidoNaFabricaMethodMutationRequest, fabricaControllerForkFabricaMethod, fabricaControllerGetRequestsFabricaMergeMethod, fabricaControllerMergeFabricaMethod, FabricaControllerMergeFabricaMethodMutationRequest, fabricaControllerPlanejarManualMethod, fabricaControllerPlanejarPedidoMethod, FabricaControllerPlanejarPedidoMethodMutationRequest, fabricaControllerRemoverPlanejamentoMethod, FabricaControllerRemoverPlanejamentoMethodMutationRequest, fabricaControllerReplanejarPedidoUseCase, fabricaControllerRequestFabricaMergeMethod, FabricaControllerRequestFabricaMergeMethodMutationRequest, fabricaControllerResetaFabricaMethod, FabricaResponseDto, MergeRequestPendingDto, PedidosPlanejadosResponseDTO, PlanejamentoResponseDTO, RemoverPlanejamentoDTO, ReplanejarPedidoDTO, ResetaFabricaDTO, UserFabricaResponseDto } from "@/api";
import { Injectable } from "@angular/core";
import { from, Observable } from "rxjs";
import { UserstoreService } from "./userstore.service";

@Injectable({
    providedIn: 'root'
})
export class FabricaService {

    constructor(private user: UserstoreService) { }

    getFabricaPrincipal(): Observable<FabricaResponseDto> {
        return from(
            fabricaControllerConsultaFabricaPrincipalMethod()
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        );
    }



    replanejamentoPedido(dto: ReplanejarPedidoDTO): Observable<void> {
        return from(
            fabricaControllerReplanejarPedidoUseCase(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        );
    }

    desplanejamentoPedido(dto: FabricaControllerDesplanejarPedidoNaFabricaMethodMutationRequest): Observable<void> {
        return from(
            fabricaControllerDesplanejarPedidoNaFabricaMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        );
    }

    removeFabrica(dto: ConsutlarFabricaDTO): Observable<void> {
        return from(
            fabricaControllerDeletarFabricaMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        );
    }

    removerPlanejamento(dto: RemoverPlanejamentoDTO): Observable<void> {
        return from(
            fabricaControllerRemoverPlanejamentoMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        );
    }

    requestMergeFabrica(dto: FabricaControllerRequestFabricaMergeMethodMutationRequest): Observable<void> {
        return from(
            fabricaControllerRequestFabricaMergeMethod(dto)
                .then(
                    response => response
                )
                .catch(
                    err => {
                        throw err;
                    }
                )
        )
    }


    mergeRequest(dto: FabricaControllerRequestFabricaMergeMethodMutationRequest): Observable<void> {
        return from(
            fabricaControllerRequestFabricaMergeMethod(dto)
                .then(
                    response => response
                )
                .catch(err => {
                    throw err;
                })
        )
    }

    getMergeRequests(): Observable<MergeRequestPendingDto[]> {
        return from(
            fabricaControllerGetRequestsFabricaMergeMethod()
                .then(
                    response => response
                )
                .catch(err => {
                    throw err;
                })
        )
    }



    mergeFabrica(dto: FabricaControllerMergeFabricaMethodMutationRequest): Observable<void> {
        return from(
            fabricaControllerMergeFabricaMethod(dto)
                .then(
                    response => response
                )
                .catch(err => {
                    throw err;
                })
        )
    }

    adicionarPlanejamentoManual(dto: AdicionarPlanejamentoDTO): Observable<void> {
        return from(
            fabricaControllerPlanejarManualMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        )
    }

    consultarPedidosPlanejados(dto: FabricaControllerConsultarPedidosPlanejadosMethodQueryParams): Observable<PedidosPlanejadosResponseDTO[]> {
        return from(
            fabricaControllerConsultarPedidosPlanejadosMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        )
    }

    planejamentos(dto: FabricaControllerPlanejarPedidoMethodMutationRequest): Observable<void> {
        return from(
            fabricaControllerPlanejarPedidoMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        )
    }

    restartFabrica(dto: ResetaFabricaDTO): Observable<FabricaResponseDto> {
        return from(
            fabricaControllerResetaFabricaMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        )
    }

    consultaMinhasFabricas(): Observable<UserFabricaResponseDto[]> {
        return from(
            fabricaControllerConsutlarFabricasDoUsuarioUseCaseMethod()
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        )
    }

    atualizar(dto: AtualizarPlanejamentoDTO): Observable<void> {
        return from(
            fabricaControllerAtualizarPlanejamentoMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        )
    }

    forkFabrica(): Observable<FabricaResponseDto> {
        return from(
            fabricaControllerForkFabricaMethod({
                userId: this.user.getUser().id
            })
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        )
    }

    consultaFabrica(dto: FabricaControllerConsultaFabricaMethodQueryParams): Observable<FabricaResponseDto> {
        return from(
            fabricaControllerConsultaFabricaMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        )
    }


    getPlanejamentos(dto: FabricaControllerConsultaPlanejamentosMethodQueryParams): Observable<PlanejamentoResponseDTO[]> {
        return from(
            fabricaControllerConsultaPlanejamentosMethod(dto)
                .then((response) => {
                    return response
                })
                .catch(err => {
                    throw err;
                })
        );
    }
}