import { Component, Inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { SecretManagerServiceService } from 'src/app/core/services/secret-manager/secret-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { CreateSecret, SecretType, SecretTypes } from '../../models/secret_models';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css']
})
export class AddComponent {
  SecretTypesConst = SecretTypes
  form: any 
  ready: boolean = false
  secretTypes: SecretType[] = []

  selectedSecretType!: string

  constructor(
    private fb: FormBuilder,
    @Inject("SecretManagerService") private secretService: SecretManagerServiceService, 
    private errorService: ErrorService,
  ) {
    this.loadSecretTypes()
  }

  setupForm() {
    if(this.selectedSecretType == "basic-auth") {
      this.form = this.fb.group({
        "value": this.fb.control(""),
        "username": this.fb.control(""),
        "password": this.fb.control(""),
        "type": this.fb.control("")
      })
    } else {
      this.form = this.fb.group({
        "value": this.fb.control(""),
        "name": this.fb.control(""),
        "type": this.fb.control(this.selectedSecretType)
      })
    }
  }

  selectSecretType() {
    console.log(this.selectedSecretType)
    this.setupForm()
  }

  createSecret() {
    if(this.form.valid) {
      var secretRequest: CreateSecret | undefined = undefined

      if(this.selectedSecretType == "basic-auth") {

      } else {
        secretRequest = this.form.value
      }

      if(!!secretRequest) {
        this.secretService.createSecret(secretRequest)
      }
    }
  }

  loadSecretTypes() {
    this.secretService.getSecretTypes().subscribe({
      next: (secretTypes) => {
        this.secretTypes = secretTypes
        this.ready = true
      },
      error: (err) => {
        this.errorService.handleError(AddComponent.name, "loadSecretTypes", err)
        this.ready = true
      }
    })
  }
}
