import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { ErrorService } from 'src/app/core/services/util/error.service';

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
    private errorService: ErrorService
  ) {
  }

  getControls() {
    return this.form.controls;
  }

  register() {
    this.waitingForRegister = true;
    this.authService.initRegister().subscribe({
      next: (resp: any) => {
        this.authService.register(resp.id, this.getControls().username.value, this.getControls().password.value, resp.ui.nodes[0].attributes.value, this.getControls().firstName.value, this.getControls().lastName.value).subscribe({
          next: (_) => {
            this.waitingForRegister = false;
            window.location.href = "/";
          },
          error: (err) => {
            this.waitingForRegister = false;
            this.errorService.handleError("RegisterComponent", "register", err);
          }
        });
      },
      error: (err) => {
        this.waitingForRegister = false;
        this.errorService.handleError("RegisterComponent", "register", err);
      }
    })
  }
}
