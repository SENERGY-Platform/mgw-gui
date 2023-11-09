import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, TitleStrategy } from '@angular/router';
import { catchError, throwError, map } from 'rxjs';
import { JobLoaderModalComponent } from 'src/app/core/components/job-loader-modal/job-loader-modal.component';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { AddModule } from '../../models/module_models';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css']
})
export class AddComponent {
  form = this.fb.group({
    "id": this.fb.control("", Validators.required),
    "version": this.fb.control("")
  })

  constructor(
    private fb: FormBuilder,
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    private router: Router,
    public dialog: MatDialog, 
    private utilsService: UtilService,
    private errorService: ErrorService,
  ) {}

  addModule() {
    this.form.markAllAsTouched()
    if(this.form.valid) {
      var module: AddModule = JSON.parse(JSON.stringify(this.form.value))
      this.moduleService.addModule(module).pipe(
        map(jobID => {
          var message = "Module installation is running"
          this.utilsService.checkJobStatus(jobID, message).subscribe(result => {
            this.navigateToModules()
            if(!result.success) {
                throwError(() => new Error(result.error))
              }
          })
        }),
        catchError(err => this.errorService.handleError(AddComponent.name, "addModule", err))
      ).subscribe()
    }
  }

  cancel() {
    this.navigateToModules()
  }

  navigateToModules() {
    this.router.navigate(["/modules"])
  }
}
