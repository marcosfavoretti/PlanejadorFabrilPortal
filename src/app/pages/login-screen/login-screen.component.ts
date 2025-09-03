import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { UserService } from '../../services/User.service';
import { LoadingPopupService } from '../../services/LoadingPopup.service';

@Component({
  selector: 'app-login-screen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.css']
})
export class LoginScreenComponent {
  constructor(
    private userService: UserService,
    private router: Router,
    private popup: LoadingPopupService
  ) { }

  onSubmit(forms: NgForm): void {
    if (forms.valid) {
      const user = forms.controls['user'].value;
      const password = forms.controls['password'].value;
      const login$ = this.userService.login({
        user,
        password
      });
      this.popup.showWhile(login$);
      login$.pipe(
        tap(() => {
          this.router.navigate(['/','app'])
        }),
      ).subscribe();
    }
  }
}
