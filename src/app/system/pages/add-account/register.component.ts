/*
 * Copyright (c) 2026 InfAI (CC SES)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Component} from '@angular/core';
import {FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from 'src/app/core/services/auth/auth.service';
import {UserService} from 'src/app/core/services/user/user.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UserRequest} from '../../models/users';
import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';
import {MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {RouterLink} from '@angular/router';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {TranslocoPipe, provideTranslocoScope} from '@jsverse/transloco';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    SpinnerComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatButton,
    RouterLink,
    PageHeaderComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('system')],
})
export class RegisterComponent {
  flowID = '';
  csrf = '';
  waitingForRegister = false;

  form = new FormGroup({
    username: new FormControl('', {nonNullable: true, validators: Validators.required}),
    password: new FormControl('', {nonNullable: true, validators: Validators.required}),
    firstName: new FormControl(undefined, {nonNullable: true}),
    lastName: new FormControl(undefined, {nonNullable: true}),
  });

  constructor(
    private authService: AuthService,
    private errorService: ErrorService,
    private userService: UserService,
    private router: Router,
  ) {}

  getControls() {
    return this.form.controls;
  }

  register() {
    this.waitingForRegister = true;
    const user: UserRequest = {
      username: this.getControls().username.value,
      meta: {
        first_name: this.getControls().firstName.value || '',
        last_name: this.getControls().lastName.value || '',
      },
      secret: this.getControls().password.value,
      type: 'human',
    };

    this.userService.addUser(user).subscribe({
      next: (_: any) => {
        this.waitingForRegister = false;
        this.router.navigate(['/system/accounts/users']);
      },
      error: (err) => {
        this.waitingForRegister = false;
        this.errorService.handleError('RegisterComponent', 'register', err);
      },
    });
  }
}
