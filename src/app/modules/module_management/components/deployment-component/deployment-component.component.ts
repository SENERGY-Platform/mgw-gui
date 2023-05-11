import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Secret } from '../../models/secret_models';
import { ModuleManagerServiceService } from '../../services/module-manager/module-manager-service.service';
import { SecretManagerServiceService } from '../../services/secret-manager/secret-manager-service.service';

@Component({
  selector: 'deployment',
  templateUrl: './deployment-component.component.html',
  styleUrls: ['./deployment-component.component.css']
})

export class DeploymentComponentComponent implements OnInit, OnChanges {
  // Input can either be a deployment template to fill out or a deployment to show or edit
  @Input() deploymentTemplate: any
  @Input() deployment: any
  @Input() mode: string = "show" // mode on how to display form data, either show values and disabled form, values and mutable forms, or no values and mutable forms 
  
  moduleID: string = ""

  formStr: any = ''

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

  deploymentTemplateData: any = {}
  deploymentTemplateDataBinding: any // need a second varaible to trigger change detection, as detection does not work with nested objects

  dependencies_module_ids: string[] = []

  constructor(private fb: FormBuilder, private moduleService: ModuleManagerServiceService, private secretSercice: SecretManagerServiceService, public dialog: MatDialog, private router: Router) {
  }

  public ngOnInit() {
    this.loadAvailableSecrets()

    // Input as a deployment template to deploy a new module    
    this.moduleID = this.deploymentTemplate['module_id']  
    this.setupDisplayData(this.moduleID);
    this.setupFormOfModule(this.form, this.deploymentTemplate, this.moduleID)
    this.setupDependencies(this.deploymentTemplate)
    this.deploymentTemplateDataBinding = this.deploymentTemplateData
  }


  ngOnChanges(changes: SimpleChanges): void {
    this.mode = changes['mode'].currentValue
  }

  public setupDisplayData(module_id: string) {
    this.deploymentTemplateData[module_id] = {
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
        if(!(secretType in this.secretOptions)) {
          this.secretOptions[secret.type] = []
        }
        
        this.secretOptions[secret.type].push(secret)
      });
      this.secretOptionsBinding = this.secretOptions
    })
  }

  submit() {
    console.log(this.form)
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
      this.deploymentTemplateData[module_id]['secrets'].push(secret)
      this.setupFormControl(form.get("secrets"), secret_id, secret.required, [], false)
    })
  }

  setupHostResources(form: any, inputTemplate: any, module_id: string) {
    var host_resources = new Map(Object.entries(inputTemplate['host_resources']))
    host_resources.forEach((host_resource: any, host_resource_id: any) => {
      host_resource['id'] = host_resource_id
      this.deploymentTemplateData[module_id]['host_resources'].push(host_resource)
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
      this.deploymentTemplateData[module_id]['configs'].push(config)
      
      this.setupFormControl(form.get("configs"), config['id'], config['required'], config['default'], config['is_list'])
    })
  }
}
