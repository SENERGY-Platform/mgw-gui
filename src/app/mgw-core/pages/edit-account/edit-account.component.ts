import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap, map, Subscription } from 'rxjs';
import { UserService } from 'src/app/core/services/user/user.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { HumanUser, UserRequest } from '../../models/users';

export function passwordMustMatch(control: AbstractControl): ValidationErrors | null {
    const confirmation = control.get("confirmation");
    const password = control.get('password')
    return password && confirmation && password.value === confirmation.value ? null : { 'match': 'passwords do not match.'};
}

@Component({
  selector: 'app-edit-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.css']
})
export class EditAccountComponent {
  form = new FormGroup({
    password: new FormControl('', {nonNullable: true, validators: Validators.required}),
    confirmation: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
  }, {validators: passwordMustMatch})
  user!: HumanUser;
  ready = false;
  private routeSub: Subscription = new Subscription();

  constructor(
    private usersService: UserService,
    private router: Router,
    private errorService: ErrorService,
    private route: ActivatedRoute
  ) {
    this.routeSub = this.route.params.pipe(
      concatMap((params) => {
        return this.usersService.getUser(params['id']);
      })
    ).subscribe({
      next: (user) => {
        this.user = user;
        this.ready = true;
      },
      error: (err) => {
        this.ready = true;
      }
    })
  }

  ngOnDestroy() {
    this.routeSub.unsubscribe();
  }

  edit() {
    this.form.updateValueAndValidity()
    const newUser: UserRequest = {
      username: this.user.username,
      secret: this.form.controls.password.value,
      meta: this.user.meta,
      type: this.user.type
    }

    this.usersService.editUser(this.user.id, newUser).subscribe({
      next: (_) => {
        this.router.navigate(['/core/accounts/users']);
      },
      error: (err) => {
        this.errorService.handleError("EditAccountComponent", "edit", err);
      }
    })
  }

  getErrorMessage() {
    if(this.form.hasError("match")) {
      return "Password does not match"
    }
    return ""
  }
}
