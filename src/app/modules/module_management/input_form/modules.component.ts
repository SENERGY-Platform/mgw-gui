import { Component } from '@angular/core';
import { FormBuilder, FormControl, ValidatorFn } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ModuleManagerServiceService } from '../../../core/services/module-manager/module-manager-service.service';
import { SecretManagerServiceService } from '../services/secret-manager/secret-manager-service.service';
import {MatDialog} from '@angular/material/dialog';
import { CreateBasicAuthSecretDialog } from '../create-basic-auth-secret-dialog/create-secret-dialog';
import { CreateCertSecretDialog } from '../create-cert-secret-dialog/create-secret-dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.css']
})
export class ModulesComponent {
  inputTemplate: any = []
  formStr: any = ''
  
  configs: any = []
  form = this.fb.group({
    "secrets": this.fb.group({}),
    "configs": this.fb.group({}),
    "resources": this.fb.group({}),
    "name": ["", Validators.required]
  })

  secrets: any = []
  secretOptions: any = {}

  constructor(private fb: FormBuilder, private moduleService: ModuleManagerServiceService, private secretSercice: SecretManagerServiceService, public dialog: MatDialog, private router: Router) {
    var module_id = ""
    this.moduleService.loadInputTemplate(module_id).subscribe((inputTemplate: any) => {
      this.inputTemplate = inputTemplate
      this.secretSercice.loadAvailableSecretTypes().subscribe((secrets: any) => {
        secrets.forEach((secret: any) => {
          var secretType = secret.type
          if(!(secretType in this.secretOptions)) {
            this.secretOptions[secret.type] = []
          } else {
            this.secretOptions[secret.type].push(secret)
          }
        });
      })
      this.setupConfigs()
      this.setupSecrets()
    })
  }

  submit() {
    this.formStr = JSON.stringify(this.form.value)
    this.moduleService.deployModule("module_id", this.form.get("configs")?.value, this.form.get("secrets")?.value, this.form.get("resources")?.value).subscribe(result => {
      this.router.navigate(["/modules"])
    })
  }

  setupFormControl(form: any, id: string, required: boolean, defaultValue: [], is_list: boolean) {
    // no default value
    var emptyValue: any = ''
    if(is_list) {
      emptyValue = []
    } 
    
    console.log(defaultValue)
    form.addControl(id, new FormControl(defaultValue || emptyValue))

    var validators: ValidatorFn[] = []
    // Required
    if(required) {
      validators = [Validators.required]
    }
    form.get(id)?.setValidators(validators)
  }

  setupSecrets() {
    var secrets = new Map(Object.entries(this.inputTemplate['secrets']))
    secrets.forEach((secret: any, secret_id: any) => {
      secret['id'] = secret_id
      this.secrets.push(secret)
      this.setupFormControl(this.form.get("secrets"), secret_id, true, [], false)
    })
  }

  setupConfigs() {
    var configs = new Map(Object.entries(this.inputTemplate['configs']))
    configs.forEach((config: any, config_id: any) => {
      config['id'] = config_id
      
      if(config.is_list && config.options) {
        config.description = config.description + ' Examples: ' + config.options
      }
      
      this.configs.push(config)
      this.setupFormControl(this.form.get("configs"), config['id'], config['required'], config['default'], config['is_list'])
      
    })
    console.log(this.configs)
  }

  add(event: any, formGroup: string, config_id: string): void {
    const value = (event.value || '').trim();
    
    if (value) {
      this.form.get(formGroup)?.get(config_id)?.value.push(value);
    }
    this.form.get(formGroup)?.get(config_id)?.updateValueAndValidity()

    // Clear the input value
    event.chipInput!.clear();
  }

  remove(option: any, formGroup: string, config_id: string): void {
    const index = this.form.get(formGroup)?.get(config_id)?.value.indexOf(option);

    if (index >= 0) {
      this.form.get(formGroup)?.get(config_id)?.value.splice(index, 1);
    }
  }

  createSecret(type: string) {
    var dialogRef
    if(type == "certificate") {
      dialogRef = this.dialog.open(CreateCertSecretDialog, {data: {type: type}});
    } else if (type == "basic-auth") {
      dialogRef = this.dialog.open(CreateBasicAuthSecretDialog, {data: {type: type}});
    }

    dialogRef?.afterClosed().subscribe(createdSecret => {
      if(createdSecret) {
        console.log(createdSecret)
        this.secretOptions[type].push(createdSecret)
      }
    });
  }
}
