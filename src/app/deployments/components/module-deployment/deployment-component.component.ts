import { Component, Inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NonNullableFormBuilder, ValidatorFn } from '@angular/forms';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { JobLoaderModalComponent } from 'src/app/core/components/job-loader-modal/job-loader-modal.component';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { Secret } from '../../../core/models/secret_models';
import { ModuleManagerService } from '../../../core/services/module-manager/module-manager-service.service';
import { SecretManagerServiceService } from '../../../core/services/secret-manager/secret-manager-service.service';
import { DeploymentRequest, DeploymentTemplate, DeploymentUpdateTemplate } from '../../models/deployment_models';

@Component({
  selector: 'deployment',
  templateUrl: './deployment-component.component.html',
  styleUrls: ['./deployment-component.component.css']
})

export class DeploymentComponentComponent implements OnInit, OnChanges {
  @Input() mode: string = "new"
  @Input() deploymentTemplate!: DeploymentTemplate | DeploymentUpdateTemplate
  @Input() moduleID!: string
  @Input() deploymentID!: string

  formStr: any = ''
  ready: boolean = false
  secretOptions: any = {}
  secretOptionsBinding: any 

  inputForm = {
    "module_id": this.fb.control(this.moduleID),
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

  constructor(
    private fb: FormBuilder, 
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    @Inject('SecretManagerService') private secretSercice: SecretManagerServiceService, 
    public dialog: MatDialog, 
    private router: Router,
    private errorService: ErrorService,
    private utilsService: UtilService
  ) {
  }

  public ngOnInit() {
    this.loadAvailableSecrets()
  }

  setup(template: any) {
    this.setupDisplayData(this.moduleID);
    this.setupFormOfModule(this.form, template, this.moduleID)
    this.setupDependencies(template)
    this.deploymentTemplateDataBinding = this.deploymentTemplateData
    this.ready = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // get changes as deployment template is loaded async
    this.mode = changes['mode'].currentValue   
    var deploymentTemplate = changes['deploymentTemplate'].currentValue 

    if(changes['moduleID']) {
      this.moduleID = changes['moduleID'].currentValue 
      this.inputForm.module_id.patchValue(this.moduleID)
    }

    if(changes['deploymentID']) {
      this.deploymentID = changes['deploymentID'].currentValue 
    }

    this.setup(deploymentTemplate)
  }

  public setupDisplayData(module_id: string) {
    this.deploymentTemplateData[module_id] = {
      "module_id": module_id,
      "secrets": [],
      "configs": [],
      "host_resources": []
    }
  }

  public setupFormOfModule(form: any, inputTemplate: any, module_id: string) {
    if(this.mode != 'new') {
      form.controls.name.patchValue(inputTemplate.name)
    }

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

  filterNullValuesInForm(object: any) {
    Object.keys(object).forEach(key => {
      if (object[key] && typeof object[key] === "object") {
        this.filterNullValuesInForm(object[key]);
      } else if (object[key] === null) {
        delete object[key];
      }
    });
  }

  submit() {
    this.form.markAllAsTouched()
    if(this.form.valid) {
      var deploymentRequest: DeploymentRequest = JSON.parse(JSON.stringify(this.form.value))
      this.filterNullValuesInForm(deploymentRequest)

      if(this.mode == "new") {
        this.moduleService.deployModule(deploymentRequest).subscribe({
          next: () => {
              this.router.navigate(["/deployments"])
          },
          error: (err) => {
            this.errorService.handleError(DeploymentComponentComponent.name, "submit", err)
          }
        })
      } else if(this.mode == "edit") {
        this.moduleService.updateDeployment(this.deploymentID, deploymentRequest).subscribe({
          next: (jobID) => {
            var message = "Deployment update is running"
            var self = this
            this.utilsService.checkJobStatus(jobID, message, function() {
              self.router.navigate(["/deployments"])
            })
          },
          error: (err) => {
            this.errorService.handleError(DeploymentComponentComponent.name, "submit", err)
          }
        })
      }
      
    }
  }

  setupFormControl(form: any, id: string, required: boolean, defaultValue: [], is_list: boolean) {
    // no default value
    var emptyValue: any = null // null gets filtered out of the form data
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

      if(this.mode != "new") {
        var defaultValue = secret['value']
      }
      this.setupFormControl(form.get("secrets"), secret_id, secret.required, defaultValue, false)
    })
  }

  setupHostResources(form: any, inputTemplate: any, module_id: string) {
    var host_resources = new Map(Object.entries(inputTemplate['host_resources']))
    host_resources.forEach((host_resource: any, host_resource_id: any) => {
      host_resource['id'] = host_resource_id
      this.deploymentTemplateData[module_id]['host_resources'].push(host_resource)
      if(this.mode != "new") {
        var defaultValue = host_resource['value']
      }
      this.setupFormControl(form.get("host_resources"), host_resource_id, host_resource.required, defaultValue, false)
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
      
      var defaultValue = config['default']
      if(this.mode != "new") {
        defaultValue = config['value']
      }
      this.setupFormControl(form.get("configs"), config['id'], config['required'], defaultValue, config['is_list'])
    })
  }
}
