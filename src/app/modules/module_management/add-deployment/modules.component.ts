import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ModuleManagerServiceService } from '../services/module-manager/module-manager-service.service';
import { SecretManagerServiceService } from '../services/secret-manager/secret-manager-service.service';
import {MatDialog} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Secret } from '../models/secret_models';

@Component({
  selector: 'modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.css']
})
export class ModulesComponent {
  formStr: any = ''
  ready: boolean = false 

  secretOptions: any = {}
  secretOptionsBinding: any 

  inputForm = {
    "secrets": this.fb.group({}),
    "configs": this.fb.group({}),
    "host_resources": this.fb.group({}),
    "name": this.fb.control("", Validators.required),
    "dependencies": this.fb.group({})
  }

  form = this.fb.group(this.inputForm)

  displayData: any = {}
  displayDataBinding: any 

  module_id: string = ""
  dependencies_module_ids: string[] = []

  constructor(private fb: FormBuilder, private moduleService: ModuleManagerServiceService, private secretSercice: SecretManagerServiceService, public dialog: MatDialog, private router: Router) {
    this.moduleService.loadDeploymentTemplate("").subscribe((inputTemplate: any) => {
      this.module_id = inputTemplate['module_id']
      this.setupDisplayData(this.module_id);
      this.module_id = this.module_id
      this.setupFormOfModule(this.form, inputTemplate, this.module_id)
      this.setupDependencies(inputTemplate)

      this.displayDataBinding = this.displayData
      this.ready = true
    })

    this.loadAvailableSecrets()

  }

  public setupDisplayData(module_id: string) {
    this.displayData[module_id] = {
      "secrets": [],
      "configs": [],
      "host_resources": []
    }
  }

  public setupFormOfModule(form: any, inputTemplate: any, module_id: string) {
    this.setupConfigs(form, inputTemplate, module_id)
    this.setupSecrets(form, inputTemplate, module_id)
    this.setupHostResources(form, inputTemplate, module_id)
  }

  public setupDependencies(inputTemplate: any) {

    if(inputTemplate['dependencies']) {
      for (const [moduleIDOfDep, inputTemplateOfDep] of Object.entries(inputTemplate['dependencies'])) {
        this.dependencies_module_ids.push(moduleIDOfDep);
        this.setupDisplayData(moduleIDOfDep);

        // first add empty FormGroup, then add single controls, new Formgroup(this.inputForm) does not work
        (<FormGroup>this.form.get("dependencies")).addControl(moduleIDOfDep, new FormGroup({}));
        var dependencyFormGroup = (<FormGroup>this.form.get("dependencies")?.get(moduleIDOfDep))
        dependencyFormGroup.addControl("secrets", this.fb.group({}))
        dependencyFormGroup.addControl("configs", this.fb.group({}))
        dependencyFormGroup.addControl("host_resources", this.fb.group({}))
        dependencyFormGroup.addControl("name", new FormControl(""))

        dependencyFormGroup.get('name')?.setValidators([Validators.required])
        
        this.setupFormOfModule(this.form.get("dependencies")?.get(moduleIDOfDep), inputTemplateOfDep, moduleIDOfDep)
      }
    }
  }

  loadAvailableSecrets() {
    this.secretSercice.loadAvailableSecretTypes().subscribe((secrets: Secret[]) => {
      secrets.forEach((secret: any) => {
        var secretType = secret.type
        console.log(secretType)
        if(!(secretType in this.secretOptions)) {
          this.secretOptions[secret.type] = []
        }
        
        this.secretOptions[secret.type].push(secret)
      });
      this.secretOptionsBinding = this.secretOptions
    })
  }

  submit() {
    this.form.markAllAsTouched()
    if(this.form.valid) {
      this.formStr = JSON.stringify(this.form.value)
      this.moduleService.deployModule("module_id", this.form.get("configs")?.value, this.form.get("secrets")?.value, this.form.get("host_resources")?.value, this.form.get('name')?.value).subscribe(result => {
        // TODO error 
        this.router.navigate(["/modules"])
      })
    }
  }

  setupFormControl(form: any, id: string, required: boolean, defaultValue: [], is_list: boolean) {
    // no default value
    var emptyValue: any = ''
    if(is_list) {
      emptyValue = []
    } 
    
    form.addControl(id, new FormControl(defaultValue || emptyValue))

    var validators: ValidatorFn[] = []
    // Required
    if(required) {
      validators = [Validators.required]
    }
    form.get(id)?.setValidators(validators)
  }

  setupSecrets(form: any, inputTemplate: any, module_id: string) {
    var secrets = new Map(Object.entries(inputTemplate['secrets']))
    secrets.forEach((secret: any, secret_id: any) => {
      secret['id'] = secret_id
      this.displayData[module_id]['secrets'].push(secret)
      this.setupFormControl(form.get("secrets"), secret_id, secret.required, [], false)
    })
  }

  setupHostResources(form: any, inputTemplate: any, module_id: string) {
    var host_resources = new Map(Object.entries(inputTemplate['host_resources']))
    host_resources.forEach((host_resource: any, host_resource_id: any) => {
      host_resource['id'] = host_resource_id
      this.displayData[module_id]['host_resources'].push(host_resource)
      this.setupFormControl(form.get("host_resources"), host_resource_id, host_resource.required, [], false)
    })
  }

  setupConfigs(form: any, inputTemplate: any, module_id: string) {
    var configs = new Map(Object.entries(inputTemplate['configs']))
    configs.forEach((config: any, config_id: any) => {      
      if(config.is_list && config.options) {
        config.description = config.description + ' Examples: ' + config.options
      }
      config['id'] = config_id
      this.displayData[module_id]['configs'].push(config)
      
      this.setupFormControl(form.get("configs"), config['id'], config['required'], config['default'], config['is_list'])
    })
  }

  
}
