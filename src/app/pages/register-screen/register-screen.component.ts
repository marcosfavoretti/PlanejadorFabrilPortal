import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, tap } from 'rxjs';
import { User } from '../../../api';
import { UserService } from '../../services/User.service';
import { LoadingPopupService } from '../../services/LoadingPopup.service';

@Component({
  selector: 'app-register-screen',
  imports: [
    FormsModule
  ],
  templateUrl: './register-screen.component.html',
  styleUrl: './register-screen.component.css'
})
export class RegisterScreenComponent {
  constructor(
    private userService: UserService,
    private router: Router,
    private popup: LoadingPopupService
  ) { }

  onSubmit(forms: NgForm): void {
    if (forms.valid) {
      const user = forms.controls['user'].value;
      const password = forms.controls['password'].value;
      const email = forms.controls['email'].value;
      const register$ = this.userService.register({
        name: user,
        email: email,
        password: password
      });
      this.popup.showWhile(register$);
      register$.pipe(
        tap(() => {
          firstValueFrom(this.userService.login({ user, password }))
            .then(
              () => this.router.navigate(['/', 'login'])
            )
        }),
      ).subscribe();
    }
  }
}
