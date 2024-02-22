import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { UserService } from 'src/app/core/services/user/user.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { User, UserRequest } from '../../models/users';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  flowID: string = "";
  csrf: string = "";
  waitingForRegister = false;

  form = new FormGroup({
    username: new FormControl('', {nonNullable: true, validators: Validators.required}),
    password: new FormControl('', {nonNullable: true, validators: Validators.required}),
    firstName: new FormControl(undefined, {nonNullable: true}),
    lastName: new FormControl(undefined, {nonNullable: true}),
  })

  constructor(
    private authService: AuthService,
    private errorService: ErrorService,
    private userService: UserService,
    private router: Router
  ) {
  }

  getControls() {
    return this.form.controls;
  }

  register() {
    this.waitingForRegister = true;
    const user: UserRequest = {
      username: this.getControls().username.value,
      meta: {
        first_name: this.getControls().firstName.value || "",
        last_name: this.getControls().lastName.value || ""
      },
      secret: this.getControls().password.value,
      type: "human"
    }

    this.userService.addUser(user).subscribe({
      next: (_: any) => {
        this.waitingForRegister = false;
        this.router.navigate(['/core/accounts'])
      },
      error: (err) => {
        this.waitingForRegister = false;
        this.errorService.handleError("RegisterComponent", "register", err);
      }
    })
  }
}
