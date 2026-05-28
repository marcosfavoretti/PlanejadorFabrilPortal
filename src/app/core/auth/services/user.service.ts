import { Injectable } from '@angular/core';
import {
  AuthControllerGenerateInviteMutationRequest,
  AuthControllerGenerateInviteMutationResponse,
  AuthControllerRegisterMutationResponse,
  AuthControllerValidateUserQueryResponse,
  AuthDto,
  CargoControllerSetUserCargoMethodMutationRequest,
  CreateUserDto,
  UserResponseDTO,
  authControllerCheckToken,
  authControllerDetail,
  authControllerGenerateInvite,
  authControllerListUsers,
  authControllerLogin,
  authControllerLogout,
  authControllerRegister,
  authControllerRegisterWithInvite,
  authControllerValidateInvite,
  cargoControllerSetUserCargoMethod,
} from '@/api/auth';
import { clearAuthToken, readStoredAuthToken, storeAuthToken } from '@/app/core/auth/utils/auth-token';
import { from, Observable } from 'rxjs';

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
    );
  }

  logout(): Observable<void> {
    return from(
      authControllerLogout()
        .then(() => {
          clearAuthToken();
        })
        .catch(err => {
          clearAuthToken();
          throw err;
        })
    );
  }

  detail(): Observable<UserResponseDTO> {
    return from(
      authControllerDetail()
        .then(data => {
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
    return from(authControllerRegister(dto));
  }

  validateRegisterToken(token: string): Observable<AuthControllerValidateUserQueryResponse> {
    return from(authControllerValidateInvite(token));
  }

  registerWithInvite(dto: CreateUserDto, token: string): Observable<AuthControllerRegisterMutationResponse> {
    return from(authControllerRegisterWithInvite(token, dto));
  }

  generateInvite(dto: AuthControllerGenerateInviteMutationRequest): Observable<AuthControllerGenerateInviteMutationResponse> {
    return from(authControllerGenerateInvite(dto));
  }

  listUsers(): Observable<UserResponseDTO[]> {
    return from(authControllerListUsers());
  }

  setUserCargo(dto: CargoControllerSetUserCargoMethodMutationRequest): Observable<void> {
    return from(cargoControllerSetUserCargoMethod(dto));
  }

  ping(): Observable<void> {
    return from(authControllerCheckToken());
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
