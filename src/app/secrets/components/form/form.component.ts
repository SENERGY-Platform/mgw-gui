import { Component, Inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { SecretManagerServiceService } from 'src/app/core/services/secret-manager/secret-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { CreateSecret, Secret, SecretType, SecretTypes } from '../../models/secret_models';

@Component({
  selector: 'secret-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnChanges, OnInit {
  @Input() mode: string = "add" 
  @Input() secretID!: string
  form: any 
  SecretTypesConst = SecretTypes
  ready: boolean = false
  secretTypes: SecretType[] = []
  selectedSecretType!: string

  constructor(
    private fb: FormBuilder,
    @Inject("SecretManagerService") private secretService: SecretManagerServiceService, 
    private errorService: ErrorService,
    private router: Router,
  ) {
    
  }

  ngOnInit(): void {
    if(this.mode == "add") {
      this.loadSecretTypes()
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    var attribute = "secretID"
    if (changes[attribute] && changes[attribute].currentValue) {
      this.secretID = changes[attribute].currentValue
      this.ready = false
      this.secretService.getSecret(this.secretID).subscribe(
        {
          next: (secret) => {
            this.selectedSecretType = secret.type
            this.setupForm(secret)
            this.ready = true
          },
          error: (err) => {
            this.errorService.handleError(FormComponent.name, "ngOnChanges", err)
            this.ready = true
          }
        }
      )
    }
  }

  loadSecretTypes() {
    this.secretService.getSecretTypes().subscribe({
      next: (secretTypes) => {
        this.secretTypes = secretTypes
        this.ready = true
      },
      error: (err) => {
        this.errorService.handleError(FormComponent.name, "loadSecretTypes", err)
        this.ready = true
      }
    })
  }


  setupForm(secret: Secret | null = null) {
    var secretName = ""
    var secretType = this.selectedSecretType
    var secretValue = ""

    if(!!secret) {
      secretName = secret.name
      secretType = secret.type
      secretValue = secret.value
    }

    if(this.selectedSecretType == this.SecretTypesConst.BasicAuth) {
      var username = ""
      var password = ""

      if(!!secret) {
        var credentialData = JSON.parse(secretValue)
        username = credentialData['username']
        password = credentialData['password']
      }

      this.form = this.fb.group({
        "name": this.fb.control(secretName),
        "username": this.fb.control(username),
        "password": this.fb.control(password),
        "type": this.fb.control(secretType)
      })
    } else {
      this.form = this.fb.group({
        "value": this.fb.control(secretValue),
        "name": this.fb.control(secretName),
        "type": this.fb.control(secretType)
      })
    }
  }

  selectSecretType() {
    this.setupForm()
  }

  parseSecretRequest(): CreateSecret {
    var secretRequest: CreateSecret

    if(this.selectedSecretType == this.SecretTypesConst.BasicAuth) {
      secretRequest = {
        "name": this.form.get("name").value,
        "type": this.form.get("type").value,
        "value": JSON.stringify({"username": this.form.get("username").value, "password": this.form.get("password").value})
      }
    } else {
      secretRequest = this.form.value
    }

    return secretRequest
  }

  createSecret() {
    if(this.form.valid) {
      var secretRequest = this.parseSecretRequest()

      if(!!secretRequest) {
        this.ready = false
        this.secretService.createSecret(secretRequest).subscribe(
          {
            next: (_) => {
              this.ready = true
              this.router.navigate(["/secrets"])
            },
            error: (err) => {
              this.errorService.handleError(FormComponent.name, "createSecret", err)
              this.ready = true
            }
          }
        )
      }
    }
  }

  updateSecret() {
    if(this.form.valid) {
      var secretRequest = this.parseSecretRequest()

      if(!!secretRequest) {
        this.ready = false
        this.secretService.updateSecret(secretRequest, this.secretID).subscribe(
          {
            next: (_) => {
              this.ready = true
              this.router.navigate(["/secrets"])
            },
            error: (err) => {
              this.errorService.handleError(FormComponent.name, "updateSecret", err)
              this.ready = true
            }
          }
        )
      }
    }
  }
}
