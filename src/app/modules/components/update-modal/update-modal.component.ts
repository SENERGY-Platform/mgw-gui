import { Component, Inject } from '@angular/core';
import { Form, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { throwMatDuplicatedDrawerError } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { ModuleUpdate, ModuleUpdates } from '../../models/module_models';

@Component({
  selector: 'app-update-modal',
  templateUrl: './update-modal.component.html',
  styleUrls: ['./update-modal.component.css']
})
export class UpdateModalComponent {
  availableModuleUpdate: ModuleUpdate
  selectedVersionsPerModule!: Record<string, string>
  form: any = this.fb.group({}) 
  moduleIsReadyToBeInstalled: boolean = false
  moduleID!: string

  constructor(
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    private errorService: ErrorService,
    public dialogRef: MatDialogRef<UpdateModalComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
    private utilService: UtilService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.availableModuleUpdate = data.availableModuleUpdate
    this.moduleID = data.moduleID 

    this.form = this.fb.group({
        "version": this.fb.control([this.availableModuleUpdate.versions])
    })
  }

  checkCompatibility() {
    var compatibilityRequestBody = this.form.value 
    
    // Check if update is compatible to all installed modules    
    this.moduleService.checkIfModuleUpdateCanBeDone(this.moduleID, compatibilityRequestBody).subscribe(
        {
        next: (jobID) => {
          var message = "Check if update is possible"
          var self = this
          this.utilService.checkJobStatus(jobID, message, function() {
            self.moduleService.getAvailableModuleUpdates(self.moduleID).subscribe(
              {
                next: (moduleUpdate) => {
                  if(moduleUpdate.pending) {
                    // Update is compatible and can be installed
                    self.moduleIsReadyToBeInstalled = true
                  }
                }, 
                error: (err) => {
                  self.errorService.handleError(UpdateModalComponent.name, "checkCompatibility", err)
                }
              }
            )
          })
        }, 
        error: (err) => {
          this.errorService.handleError(UpdateModalComponent.name, "checkCompatibility", err)
        }
    })
  }

  startUpdate() {
    this.router.navigate(['/modules/update/' + encodeURIComponent(this.moduleID)])
    this.dialogRef.close()
  }

  cancel() {
    this.dialogRef.close()
  }
}
