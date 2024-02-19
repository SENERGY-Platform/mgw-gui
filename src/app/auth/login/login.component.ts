import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { ErrorService } from 'src/app/core/services/util/error.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  flowID: string = "";
  csrf: string = "";
  waitingForLogin = false;

  form = new FormGroup({
    username: new FormControl('', {nonNullable: true, validators: Validators.required}),
    password: new FormControl('', {nonNullable: true, validators: Validators.required}),
  })

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private errorService: ErrorService
  ) {
    this.route.params.subscribe(params => {
      this.flowID = params['flow']
    })
   
  }

  login() {
    this.waitingForLogin = true;
    this.authService.initFlow().subscribe({
      next: (resp: any) => {
        this.flowID = resp.id;
        this.csrf = resp.ui.nodes[0].attributes.value;
        this.authService.login(this.flowID, this.form.controls.username.value, this.form.controls.password.value, this.csrf).subscribe({
          next: (_) => {
            this.waitingForLogin = false;
            window.location.href = "/";
          },
          error: (err) => {
            this.waitingForLogin = false;
            this.errorService.handleError("LoginComponent", "login", err);
          }
        });
      },
      error: (err) => {
        this.waitingForLogin = false;
        this.errorService.handleError("LoginComponent", "login", err);
      }
    })
  }
}
