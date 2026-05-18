import { Injectable } from "@angular/core";
import { authControllerCheckToken, authControllerDetail, authControllerLogin, authControllerLogout, authControllerRegister, authControllerValidateUser, AuthControllerRegisterMutationResponse, AuthControllerValidateUserQueryResponse, AuthDto, CreateUserDto, UserResponseDTO, authControllerValidateInvite, authControllerRegisterWithInvite, } from "@/api/auth";
import { from, Observable } from "rxjs";
import { clearAuthToken, readStoredAuthToken, storeAuthToken } from "@/app/core/auth/utils/auth-token";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    login(dto: AuthDto): Observable<void> {
        return from(
            authControllerLogin(dto)
                .then((response: any) => {
                    if (response && response.token) {
                        storeAuthToken(response.token);
                    }
                })
                .catch((err: unknown) => {
                    throw err;
                })
        );
    }

    logout(): Observable<void> {
        return from(
            authControllerLogout()
                .then(() => {
                    clearAuthToken();
                })
                .catch((err: unknown) => {
                    clearAuthToken();
                    throw err;
                })
        )
    }

    detail(): Observable<UserResponseDTO> {
        return from(
            authControllerDetail()
                .then((data: unknown) => {
                    const user = data as UserResponseDTO;
                    if (this.isUserResponse(user)) {
                        return user;
                    }

                    return this.getDevUserFromStoredToken() ?? user;
                })
                .catch((err: unknown) => {
                    const devUser = this.getDevUserFromStoredToken();

                    if (devUser) {
                        return devUser;
                    }

                    throw err;
                })
        );
    }

    register(dto: CreateUserDto): Observable<AuthControllerRegisterMutationResponse> {
        return from(
            authControllerRegister(dto)
                .then((data: AuthControllerRegisterMutationResponse) => data)
                .catch((err: unknown) => {
                    throw err;
                })
        );
    }

    validateRegisterToken(token: string): Observable<AuthControllerValidateUserQueryResponse> {
        return from(
            authControllerValidateInvite(token)
                .then((data: AuthControllerValidateUserQueryResponse) => data)
                .catch((err: unknown) => {
                    throw err;
                })
        );
    }

    registerWithInvite(dto: CreateUserDto, token: string): Observable<AuthControllerRegisterMutationResponse> {
        return from(
            authControllerRegisterWithInvite(token, dto)
                .then((data: AuthControllerRegisterMutationResponse) => data)
                .catch((err: unknown) => {
                    throw err;
                })
        );
    }

    ping(): Observable<void> {
        return from(
            authControllerCheckToken()
        )
    }

    private getDevUserFromStoredToken(): UserResponseDTO | null {
        const token = readStoredAuthToken();

        if (!token) {
            return null;
        }

        try {
            const payload = this.decodeJwtPayload(token);
            const id = payload?.['id'];
            const name = payload?.['name'];
            const email = payload?.['email'];
            const avatar = payload?.['avatar'];
            const cargosLista = payload?.['cargosLista'];

            if (!id || !name || !email) {
                return null;
            }

            return {
                id: String(id),
                name: String(name),
                email: String(email),
                avatar: String(avatar ?? 'None'),
                cargosLista: Array.isArray(cargosLista)
                    ? cargosLista.map(cargo => String(cargo))
                    : []
            };
        } catch {
            clearAuthToken();
            return null;
        }
    }

    private isUserResponse(data: UserResponseDTO | null | undefined): data is UserResponseDTO {
        return !!data?.id && !!data?.name && !!data?.email;
    }

    private decodeJwtPayload(token: string): Record<string, unknown> | null {
        const payload = token.split('.')[1];

        if (!payload) {
            return null;
        }

        const normalizedPayload = payload
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(payload.length / 4) * 4, '=');

        return JSON.parse(atob(normalizedPayload));
    }
}
