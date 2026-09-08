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

import {Component, OnDestroy, inject} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {concatMap, map, Subscription} from 'rxjs';
import {UserService} from 'src/app/core/services/user/user.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {HumanUser, UserRequest} from '../../models/users';
import {SpinnerComponent} from '../../../core/components/spinner/spinner.component';

import {MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {PageHeaderComponent} from 'src/app/core/components/page-header/page-header.component';
import {TranslocoPipe, TranslocoService, provideTranslocoScope} from '@jsverse/transloco';

export function passwordMustMatch(control: AbstractControl): ValidationErrors | null {
  const confirmation = control.get('confirmation');
  const password = control.get('password');
  return password && confirmation && password.value === confirmation.value ? null : {match: 'passwords do not match.'};
}

@Component({
  selector: 'app-edit-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SpinnerComponent,
    MatFormField,
    MatInput,
    MatButton,
    MatIcon,
    RouterLink,
    PageHeaderComponent,
    TranslocoPipe,
  ],
  providers: [provideTranslocoScope('system')],
})
export class EditAccountComponent implements OnDestroy {
  // Resolved directly rather than through the `transloco` pipe: this is
  // computed on demand from the form's validity, not a plain template
  // binding a pipe could sit on.
  private readonly transloco = inject(TranslocoService);

  form = new FormGroup(
    {
      password: new FormControl('', {nonNullable: true, validators: Validators.required}),
      confirmation: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    },
    {validators: passwordMustMatch},
  );
  user!: HumanUser;
  ready = false;
  private routeSub: Subscription = new Subscription();

  constructor(
    private usersService: UserService,
    private router: Router,
    private errorService: ErrorService,
    private route: ActivatedRoute,
  ) {
    this.routeSub = this.route.params
      .pipe(
        concatMap((params) => {
          return this.usersService.getUser(params['id']);
        }),
      )
      .subscribe({
        next: (user) => {
          this.user = user;
          this.ready = true;
        },
        error: (err) => {
          this.ready = true;
        },
      });
  }

  ngOnDestroy() {
    this.routeSub.unsubscribe();
  }

  edit() {
    this.form.updateValueAndValidity();
    const newUser: UserRequest = {
      username: this.user.username,
      secret: this.form.controls.password.value,
      meta: this.user.meta,
      type: this.user.type,
    };

    this.usersService.editUser(this.user.id, newUser).subscribe({
      next: (_) => {
        this.router.navigate(['/system/accounts/users']);
      },
      error: (err) => {
        this.errorService.handleError('EditAccountComponent', 'edit', err);
      },
    });
  }

  getErrorMessage() {
    if (this.form.hasError('match')) {
      return this.transloco.translate<string>('system.editAccount.passwordMismatch');
    }
    return '';
  }
}
