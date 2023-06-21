import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { catchError } from 'rxjs';
import { JobLoaderModalComponent } from 'src/app/core/components/job-loader-modal/job-loader-modal.component';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
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
  ) {}

  addModule() {
    this.form.markAllAsTouched()
    if(this.form.valid) {
      var module: AddModule = JSON.parse(JSON.stringify(this.form.value))
      this.moduleService.addModule(module).subscribe(jobID => {
        var message = "Module creation is running"
        this.checkJobStatus(jobID, message)
      })
    }
  }

  checkJobStatus(jobID: string, message: string) {
    var dialogRef = this.dialog.open(JobLoaderModalComponent, {data: {jobID: jobID, message: message}});
    
    dialogRef?.afterClosed().subscribe(jobIsCompleted => {
      if(jobIsCompleted) {
        this.router.navigate(["/modules"])
      }
    });
  }
}
