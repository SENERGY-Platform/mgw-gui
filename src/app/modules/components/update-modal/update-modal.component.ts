import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { catchError, concatMap, of, throwError } from 'rxjs';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { ModuleUpdateTemplate } from 'src/app/deployments/models/deployment_models';
import { ModuleUpdate, ModuleUpdateRequest } from '../../models/module_models';
import * as semver from "semver";

@Component({
  selector: 'app-update-modal',
  templateUrl: './update-modal.component.html',
  styleUrls: ['./update-modal.component.css']
})
export class UpdateModalComponent implements OnInit {
  availableModuleUpdate: ModuleUpdate
  form: any = this.fb.group({}) 
  moduleID!: string
  selectedVersion!: string

  constructor(
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    private errorService: ErrorService,
    public dialogRef: MatDialogRef<UpdateModalComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private utilService: UtilService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.availableModuleUpdate = data.availableModuleUpdate
    this.moduleID = data.moduleID 
  }

  ngOnInit(): void {
    this.setupForm()
  }

  setupForm() {
    var versions = this.availableModuleUpdate.versions.sort((a, b) => {
      return semver.gte(a, b) ? 1 : -1 
    }).reverse()

    this.selectedVersion = versions[0]

    this.form = this.fb.group({
      "version": this.fb.control(this.selectedVersion)
    })
  }

  prepareUpdate() {
    var compatibilityRequestBody = this.form.value 
    
    // Check if update is compatible to all installed modules    
    this.moduleService.prepareModuleUpdate(this.moduleID, compatibilityRequestBody).pipe(
        concatMap(jobID => {
          var message = "Prepare update"
          return this.utilService.checkJobStatus(jobID, message)
        }),
        concatMap(result => {
          if(!result.success) {
              return throwError(() => new Error(result.error))
          }

          return this.moduleService.getAvailableModuleUpdates(this.moduleID)
        }),
        concatMap(moduleUpdate => {
          // Update is compatible and can be installed
          if(moduleUpdate.pending) {
            this.update(moduleUpdate.pending_versions)
          } else {
            this.closeDialog()
          }
          return of()
        }), 
        catchError(err => {
          this.errorService.handleError(UpdateModalComponent.name, "update", err)
          this.closeDialog()
          return of()
        })  
    ).subscribe()
  }

  update(pendingVersions: Record<string, string>) {
    // Check if there is a need to update values in the formular
    this.moduleService.getModuleUpdateTemplate(this.moduleID).subscribe(
      {
        next: (template: ModuleUpdateTemplate) => {
          if(
            this.utilService.objectIsEmptyOrNull(template.configs) &&
            this.utilService.objectIsEmptyOrNull(template.secrets) && 
            this.utilService.objectIsEmptyOrNull(template.host_resources)
          ) {
            // Nothing in template -> just update without showing formular
            this.updateModuleWithoutConfiguration()
          } else {
            this.router.navigate(['/modules/update/' + encodeURIComponent(this.moduleID)], {state: {"pending_versions": pendingVersions}})
            this.closeDialog()
          }
        },
        error: (err) => {
          this.errorService.handleError(UpdateModalComponent.name, "ngOnInit", err)
          this.closeDialog()
        }
      }
    )
  }

  closeDialog() {
    this.dialogRef.close()
  }

  updateModuleWithoutConfiguration() {
    var emptyModuleUpdate: ModuleUpdateRequest = {
      "configs": null,
      "host_resources": null,
      "secrets": null,
      "module_id": this.moduleID,
      'dependencies': null
    }

    this.moduleService.updateModule(this.moduleID, emptyModuleUpdate).subscribe({
      next: (jobID) => {
        var message = "Module update is running"
        this.utilService.checkJobStatus(jobID, message).subscribe(result => {
          this.closeDialog()
          if(!result.success) {
            throwError(() => new Error(result.error))
          }
        })
      },
      error: (err) => {
        this.errorService.handleError(UpdateModalComponent.name, "updateModule", err)
        this.closeDialog()
      }
    }) 
  }
}
