import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  flowID: string = "";
  csrf: string = "";

  form = new FormGroup({
    username: new FormControl('', {nonNullable: true, validators: Validators.required}),
    password: new FormControl('', {nonNullable: true, validators: Validators.required}),
  })

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute    
  ) {
    this.route.params.subscribe(params => {
      this.flowID = params['flow']
    })
   
  }

  login() {
    this.authService.initFlow().subscribe({
      next: (resp: any) => {
        this.flowID = resp.id;
        this.csrf = resp.ui.nodes[0].attributes.value;
        this.authService.login(this.flowID, this.form.controls.username.value, this.form.controls.password.value, this.csrf).subscribe();
      }
    })
  }
}
