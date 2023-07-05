import { Component, Inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NonNullableFormBuilder, ValidatorFn } from '@angular/forms';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { Secret } from '../../../secrets/models/secret_models';
import { ModuleManagerService } from '../../../core/services/module-manager/module-manager-service.service';
import { SecretManagerServiceService } from '../../../core/services/secret-manager/secret-manager-service.service';
import { DeploymentRequest, DeploymentTemplate, DeploymentUpdateTemplate, ModuleUpdateTemplate } from '../../models/deployment_models';
import { HostManagerService } from 'src/app/core/services/host-manager/host-manager.service';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'deployment',
  templateUrl: './deployment-component.component.html',
  styleUrls: ['./deployment-component.component.css']
})

export class DeploymentComponentComponent implements OnInit {
  @Input() mode: string = "new"
  @Input() moduleID!: string
  @Input() deploymentID!: string

  deploymentTemplate!: DeploymentTemplate | DeploymentUpdateTemplate | ModuleUpdateTemplate
  formStr: any = ''
  ready: boolean = false

  secretOptions: any = {}
  secretOptionsBinding: any 

  hostResourcesOptions: any = {}

  inputForm = {
    "module_id": this.fb.control(this.moduleID),
    "secrets": this.fb.group({}),
    "configs": this.fb.group({}),
    "host_resources": this.fb.group({}),
    "name": this.fb.control(""),
    "dependencies": this.fb.group({})
  }

  form = this.fb.group(this.inputForm)

  deploymentTemplateData: any = {}
  deploymentTemplateDataBinding: any // need a second varaible to trigger change detection, as detection does not work with nested objects

  dependencies_module_ids: string[] = []
  dependencies_deployment_ids: string[] = []
  dependencyFormIDToModuleID: any = {}

  constructor(
    private fb: FormBuilder, 
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    @Inject('SecretManagerService') private secretSercice: SecretManagerServiceService, 
    @Inject('HostManagerService') private hostService: HostManagerService, 
    public dialog: MatDialog, 
    private router: Router,
    private errorService: ErrorService,
    private utilsService: UtilService
  ) {
  }

  public ngOnInit() {
    var obs = []
    obs.push(this.loadAvailableSecrets())
    obs.push(this.loadAvailableHostResources())
    
    if(this.mode == "new") {
      obs.push(this.loadDeploymentTemplate())
    } else if(this.mode == "edit") {
      obs.push(this.loadDeploymentUpdateTemplate())
    } else if(this.mode == "update") {
      obs.push(this.loadDeploymentUpdateTemplate())
    } 

    forkJoin(obs).subscribe((_) => {
      this.setup(this.deploymentTemplate)
    })
  }

  loadDeploymentUpdateTemplate(): Observable<any> {
    return new Observable(obs => {
      this.moduleService.loadDeploymentUpdateTemplate(this.deploymentID).subscribe((template: any) => {
        this.deploymentTemplate = template
        obs.next(true)
        obs.complete()
      })
    })
  }

  loadModuleUpdateTemplate(): Observable<any> {
    return new Observable(obs => {
      this.moduleService.getModuleUpdateTemplate(this.moduleID).subscribe(
        {
          next: (template: any) => {
            this.deploymentTemplate = template
            obs.next(true)
            obs.complete()
          },
          error: (err) => {
            this.errorService.handleError(DeploymentComponentComponent.name, "loadModuleUpdateTemplate", err)
          }
        }
      )
    })
  }

  loadDeploymentTemplate(): Observable<any> {
    return new Observable(obs => {
      this.moduleService.loadDeploymentTemplate(this.moduleID).subscribe(
        {
          next: (template: any) => {
            this.deploymentTemplate = template
            obs.next(true)
            obs.complete()
          },
          error: (err) => {
            this.errorService.handleError(DeploymentComponentComponent.name, "loadDeploymentTemplate", err)
          }
        }
      )
    })
  }

  setup(template: any) {
    if(this.moduleID) {
      this.inputForm.module_id.patchValue(this.moduleID)
    }

    this.setupDisplayData(this.moduleID);
    this.setupFormOfModule(this.form, template, this.moduleID)
    this.setupDependencies(template)

    this.deploymentTemplateDataBinding = this.deploymentTemplateData
    this.ready = true;
  }

  /*
  Needed when input values are loaded async and need to be updated
  ngOnChanges(changes: SimpleChanges): void {
    // get changes as deployment template and IDs are loaded async
    var attributes: string[] = ['mode', 'deploymentTemplate', 'moduleID', 'deploymentID']

    type ObjectKey = keyof typeof this;
    attributes.forEach(attribute => {
      if (changes[attribute] && changes[attribute].currentValue) {
        this[attribute as ObjectKey] = changes[attribute].currentValue
      }
    });

    if(this.moduleID) {
      this.inputForm.module_id.patchValue(this.moduleID)
    }

    if(this.deploymentTemplate) {
      this.setup(this.deploymentTemplate)
    }

  }*/

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
        // NO points as form control identifiers! -> use an alternative ID for module IDs
        var encodedModuleIDOfDep: string = self.crypto.randomUUID()
        this.dependencyFormIDToModuleID[encodedModuleIDOfDep] = moduleIDOfDep

        this.dependencies_module_ids.push(encodedModuleIDOfDep);
        this.setupDisplayData(encodedModuleIDOfDep);

        // first add empty FormGroup, then add single controls, new Formgroup(this.inputForm) does not work
        (<FormGroup>this.form.get("dependencies")).addControl(encodedModuleIDOfDep, new FormGroup({}));
        var dependenciesFormGroup = (<FormGroup>this.form.controls.dependencies)
        var dependencyFormGroup = (<FormGroup>dependenciesFormGroup.get(encodedModuleIDOfDep))

        dependencyFormGroup.addControl("secrets", this.fb.group({}))
        dependencyFormGroup.addControl("configs", this.fb.group({}))
        dependencyFormGroup.addControl("host_resources", this.fb.group({}))
        dependencyFormGroup.addControl("name", new FormControl(""))
        this.setupFormOfModule(this.form.get("dependencies")?.get(encodedModuleIDOfDep), inputTemplateOfDep, encodedModuleIDOfDep)
      }
    }
  }

  loadAvailableSecrets(): Observable<any> {
    return new Observable(obs => {
      this.secretSercice.getSecrets().subscribe((secrets: Secret[]) => {
        if(secrets) {
          secrets.forEach((secret: any) => {
            var secretType = secret.type
            if(!(secretType in this.secretOptions)) {
              this.secretOptions[secret.type] = []
            }
            
            this.secretOptions[secret.type].push(secret)
          });
          this.secretOptionsBinding = this.secretOptions
        }
        obs.next(true)
        obs.complete()
      })
    })
  }

  loadAvailableHostResources(): Observable<any> {
    return new Observable(obs => {
      this.hostService.getHostResources().subscribe(
        {
          next: (hostResources) => {
            this.hostResourcesOptions = hostResources
            obs.next(true)
            obs.complete()
          },
          error: (err) => {
            this.errorService.handleError(DeploymentComponentComponent.name, "loadAvailableHostResources", err)
          }
        }
      )
    })
  }

  filterNullValuesInForm(object: any) {
    Object.keys(object).forEach(key => {
      if (object[key] && typeof object[key] === "object") {
        this.filterNullValuesInForm(object[key]);
      } else if (object[key] === null || object[key] === undefined) {
        delete object[key];
      }
    });
  }

  replaceDependencyID(request: DeploymentRequest) {
    var oldIDs: string[] = []
    Object.keys(request.dependencies).forEach(dependencyFormularID => {
      oldIDs.push(dependencyFormularID)
      var correctDependencyID: string = this.dependencyFormIDToModuleID[dependencyFormularID]
      request.dependencies[correctDependencyID] = request.dependencies[dependencyFormularID]
    })

    oldIDs.forEach(id => {
      delete request.dependencies[id] // deletes from request: formularID: undefined
    });

  }

  submit() {
    this.form.markAllAsTouched()
    if(this.form.valid) {
      var deploymentRequest: DeploymentRequest = JSON.parse(JSON.stringify(this.form.value))

      this.replaceDependencyID(deploymentRequest)
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
