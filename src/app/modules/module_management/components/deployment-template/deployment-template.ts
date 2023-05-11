import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CreateBasicAuthSecretDialog } from '../create-basic-auth-secret-dialog/create-secret-dialog';
import { CreateCertSecretDialog } from '../create-cert-secret-dialog/create-secret-dialog';

@Component({
    selector: 'deployment-template',
    templateUrl: 'deployment-template.html',
    styleUrls: ['deployment-template.css']
})
export class DeploymentTemplate implements OnInit {
    @Input() moduleID: string = ""
    @Input() IsDependency: boolean = false 

    form: FormGroup = new FormGroup("")
    @Input() deploymentTemplateData: any
    @Input() deploymentData: any
    @Input() secretOptions: any
    @Input() mode: string = "show"

    constructor(public dialog: MatDialog, private ref: ChangeDetectorRef, private rootFormGroup: FormGroupDirective) {}

    ngOnInit(): void {
      // Child components can access parent form group via directive
      if(!this.IsDependency) {
        // Main Module Deployment
        this.form = this.rootFormGroup.control
      } else {
        // Dependency Module Deployment
        this.form = this.rootFormGroup.control.get('dependencies')!.get(this.moduleID) as FormGroup;
      }

      if(this.deploymentData) {
        this.setDeploymentData()
      }
    }

    setDeploymentData() {
      /* Set values in form controls to current values from deployment so that the User can either see or edit the values.*/

      this.form.get('name')?.patchValue(this.deploymentData.name)

      var sections = ["host_resources", "configs", "secrets"]
      sections.forEach(section => {
        for (const [id, value] of Object.entries(this.deploymentData[section])) {
          this.form.get(section)?.get(id)?.patchValue(value)
          if(this.mode == 'show') {
            this.form.get(section)?.get(id)?.disable()
          }
        }
      });
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.secretOptions = changes['secretOptions'].currentValue
        this.mode = changes['mode'].currentValue

        // TODO deploymentTemplateData direkt fuer module id nicht erst key
        this.deploymentTemplateData = changes['deploymentTemplateData'].currentValue[this.moduleID]
        
        // Set 
        this.deploymentData = changes['deploymentData'].currentValue
        if(this.deploymentData) {
          this.setDeploymentData()
        }
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