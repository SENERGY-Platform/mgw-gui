import { Component, Inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { Module } from 'src/app/modules/models/module_models';
import { Deployment } from '../../models/deployment_models';
import { CreateBasicAuthSecretDialog } from '../create-basic-auth-secret-dialog/create-secret-dialog';
import { CreateCertSecretDialog } from '../create-cert-secret-dialog/create-secret-dialog';

@Component({
    selector: 'deployment-template',
    templateUrl: 'deployment-template.html',
    styleUrls: ['deployment-template.css']
})
export class DeploymentTemplate implements OnChanges {
    @Input() moduleID: string = ""
    @Input() deploymentID: string = ""
    @Input() IsDependency: boolean = false 

    form: FormGroup = new FormGroup("")
    @Input() deploymentTemplateData: any
    @Input() secretOptions: any
    @Input() mode: string = "show"
    @Input() dependencyFormIDToModuleID!: Record<string, string>
    module!: Module
    deployment!: Deployment
    ready: boolean = false

    constructor(
      public dialog: MatDialog, 
      private rootFormGroup: FormGroupDirective,
      @Inject("ModuleManagerService") private moduleService: ModuleManagerService,
      private errorService: ErrorService
    ) {
    }

    loadModuleInfo() {
      var moduleID = this.moduleID

      // Dependency Module IDs are replaced by UUIDs
      if(this.IsDependency) {
        moduleID = this.dependencyFormIDToModuleID[this.moduleID]
      }
      this.moduleService.loadModule(moduleID).subscribe({
        next: (module) => {
          this.module = module
          this.ready = true
        },
        error: (err) => {
          this.errorService.handleError(DeploymentTemplate.name, "submit", err)
          this.ready = true
        } 
      })
    }

    loadDeploymentInfo() {
      this.moduleService.loadDeployment(this.deploymentID).subscribe({
        next: (deployment) => {
          this.deployment = deployment
          this.ready = true
        },
        error: (err) => {
          this.errorService.handleError(DeploymentTemplate.name, "submit", err)
          this.ready = true
        } 
      })
    }

    loadForm() {
      // Child components can access parent form group via directive
      if(!this.IsDependency) {
        // Main Module Deployment
        this.form = this.rootFormGroup.control
      } else {
        // Dependency Module Deployment
        this.form = this.rootFormGroup.control.get('dependencies')!.get(this.moduleID) as FormGroup;
      }
    }

    ngOnChanges(changes: SimpleChanges): void {
      // get changes as deployment template and IDs are loaded async

      var attributes: string[] = ['secretOptions', 'deploymentTemplateData', 'moduleID', 'mode', 'IsDependency', 'deploymentID', 'dependencyFormIDToModuleID']
      type ObjectKey = keyof typeof this;
      attributes.forEach(attribute => {
        if (changes[attribute] && changes[attribute].currentValue) {
          if(attribute == "deploymentTemplateData") {
            this.deploymentTemplateData = changes['deploymentTemplateData'].currentValue[this.moduleID]
          } else {
            this[attribute as ObjectKey] = changes[attribute].currentValue
          }
        }
      });

      if(this.mode == 'new') {
        this.loadModuleInfo()
      } else {
        this.loadDeploymentInfo()
      }

      this.loadForm()
    }

    add(event: any, formGroup: string, config_id: string): void {
        const value = (event.value || '').trim();
        if (value) {
          this.form?.get(formGroup)?.get(config_id)?.value.push(value);
        }
        this.form?.get(formGroup)?.get(config_id)?.updateValueAndValidity()
    
        // Clear the input value
        event.chipInput!.clear();
      }
    
      remove(option: any, formGroup: string, config_id: string): void {
        const index = this.form?.get(formGroup)?.get(config_id)?.value.indexOf(option);
    
        if (index >= 0) {
          this.form?.get(formGroup)?.get(config_id)?.value.splice(index, 1);
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
            this.secretOptions[type].push(createdSecret)
          }
        });
      }
}