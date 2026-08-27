import {Component} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from 'src/app/core/services/auth/auth.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {SpinnerComponent} from '../../core/components/spinner/spinner.component';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';
import {environment} from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    SpinnerComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
    MatIcon,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('auth')],
})
export class LoginComponent {
  flowID = '';
  csrf = '';
  waitingForLogin = false;
  returnTo = '';

  form = new FormGroup({
    username: new FormControl('', {nonNullable: true, validators: Validators.required}),
    password: new FormControl('', {nonNullable: true, validators: Validators.required}),
  });

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private errorService: ErrorService,
  ) {
    // Where the app is mounted, not a fixed path: '/core/web-ui' in an install,
    // the root under `ng serve`. Hard-coding it sent local development to the
    // installed UI after every login.
    this.returnTo = getReturnTo(this.route.snapshot.queryParamMap.get('return_to'), environment.uiBaseUrl || '/');
  }

  login() {
    if (!this.form.valid) {
      return;
    }

    this.waitingForLogin = true;
    this.authService.initFlow().subscribe({
      next: (resp: any) => {
        this.flowID = resp.id;
        this.csrf = resp.ui.nodes[0].attributes.value;
        this.authService
          .login(this.flowID, this.form.controls.username.value, this.form.controls.password.value, this.csrf)
          .subscribe({
            next: (_) => {
              this.waitingForLogin = false;
              window.location.href = this.returnTo;
            },
            error: (err) => {
              this.waitingForLogin = false;
              this.errorService.handleError('LoginComponent', 'login', err);
            },
          });
      },
      error: (err) => {
        this.waitingForLogin = false;
        this.errorService.handleError('LoginComponent', 'login', err);
      },
    });
  }
}

// One leading slash and no second one: a browser reads '//host' and '/\host'
// as a URL on another origin, so both would send the user off the gateway with
// a session that was just established here.
const returnToRegex = /^\/(?![/\\])/;

function getReturnTo(v: string | null, def: string): string {
  if (v !== null) {
    try {
      v = decodeURIComponent(v);
      if (returnToRegex.test(v)) {
        return v;
      }
    } catch (err) {
      console.log(err);
    }
  }
  return def;
}
