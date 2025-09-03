import { Injectable } from "@angular/core";
import { AuthDto, CreateUserDto, User, userControllerCheckUserAuth, userControllerCreateUserMethod, userControllerLoginMethod, userControllerLogoutMethod, userControllerUserDetailsMethod } from "../../api";
import { from, Observable, of } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    login(dto: AuthDto): Observable<void> {
        return from(
            userControllerLoginMethod(dto)
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
            userControllerLogoutMethod()
                .then(() => { })
                .catch(err => {
                    throw err;
                })
        )
    }

    detail(): Observable<User> {
        return from(
            userControllerUserDetailsMethod()
                .then((data) => data)
                .catch(err => {
                    throw err;
                })
        );
    }

    register(dto: CreateUserDto): Observable<User> {
        return from(
            userControllerCreateUserMethod(dto)
                .then((data) => data)
                .catch(err => {
                    throw err;
                })
        );
    }

    ping(): Observable<void> {
        return from(
            userControllerCheckUserAuth()
                .then(() => { })
                .catch(err => {
                    throw err;
                })
        )
    }


}