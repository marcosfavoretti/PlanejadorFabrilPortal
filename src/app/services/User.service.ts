import { Injectable, isDevMode } from "@angular/core";
import { authControllerCheckToken, authControllerDetail, authControllerLogin, authControllerLogout, authControllerRegister, authControllerValidateUser, AuthControllerRegisterMutationResponse, AuthControllerValidateUserQueryResponse, AuthDto, CreateUserDto, UserResponseDTO, authControllerValidateInvite, authControllerRegisterWithInvite, } from "../../api/auth";
import { from, Observable } from "rxjs";
import { DEV_AUTH_TOKEN_STORAGE_KEY } from "@/client";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    login(dto: AuthDto): Observable<void> {
        return from(
            authControllerLogin(dto)
                .then((response: any) => {
                    if (response && response.token) {
                        localStorage.setItem(DEV_AUTH_TOKEN_STORAGE_KEY, response.token);
                    }
                })
                .catch(err => {
                    throw err;
                })
        );
    }

    logout(): Observable<void> {
        return from(
            authControllerLogout()
                .then(() => {
                    localStorage.removeItem(DEV_AUTH_TOKEN_STORAGE_KEY);
                })
                .catch(err => {
                    localStorage.removeItem(DEV_AUTH_TOKEN_STORAGE_KEY);
                    throw err;
                })
        )
    }

    detail(): Observable<UserResponseDTO> {
        return from(
            authControllerDetail()
                .then((data) => {
                    if (this.isUserResponse(data)) {
                        return data;
                    }

                    return this.getDevUserFromStoredToken() ?? data;
                })
                .catch(err => {
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
                .then((data) => data)
                .catch(err => {
                    throw err;
                })
        );
    }

    validateRegisterToken(token: string): Observable<AuthControllerValidateUserQueryResponse> {
        return from(
            authControllerValidateInvite(token)
                .then((data) => data)
                .catch(err => {
                    throw err;
                })
        );
    }

    registerWithInvite(dto: CreateUserDto, token: string): Observable<AuthControllerRegisterMutationResponse> {
        return from(
            authControllerRegisterWithInvite(token, dto)
                .then((data) => data)
                .catch(err => {
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
        if (!isDevMode() || typeof localStorage === 'undefined') {
            return null;
        }

        const token = localStorage.getItem(DEV_AUTH_TOKEN_STORAGE_KEY);

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
            localStorage.removeItem(DEV_AUTH_TOKEN_STORAGE_KEY);
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
