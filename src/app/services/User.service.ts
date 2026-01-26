import { Injectable } from "@angular/core";
import { authControllerCheckToken, authControllerDetail, authControllerLogin, authControllerLogout, authControllerRegister, AuthControllerRegisterMutationResponse, AuthDto, CreateUserDto, UserResponseDTO, } from "../../api/auth";
import { from, Observable, of } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    login(dto: AuthDto): Observable<void> {
        return from(
            authControllerLogin(dto)
                .then((response: any) => {
                    if (response && response.token) {
                        localStorage.setItem('token', response.token);
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
                .then(() => { })
                .catch(err => {
                    throw err;
                })
        )
    }

    detail(): Observable<UserResponseDTO> {
        return from(
            authControllerDetail()
                .then((data) => data)
                .catch(err => {
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

    ping(): Observable<void> {
        return from(
            authControllerCheckToken()
        )
    }


}