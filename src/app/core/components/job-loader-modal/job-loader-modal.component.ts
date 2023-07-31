import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';

@Component({
  selector: 'app-job-loader-modal',
  templateUrl: './job-loader-modal.component.html',
  styleUrls: ['./job-loader-modal.component.css']
})
export class JobLoaderModalComponent implements OnInit {
  jobID!: string
  interval: any
  jobIsCompleted: boolean = false
  message!: string

  constructor(
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    private errorService: ErrorService,
    public dialogRef: MatDialogRef<JobLoaderModalComponent>,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    this.jobID = data.jobID
    this.message = data.message
  }

  ngOnInit(): void {
    this.interval = setInterval(() => { 
      this.moduleService.getJobStatus(this.jobID).subscribe(jobResponse => {
        if(jobResponse.completed && !jobResponse.error) {
          this.jobIsCompleted = true
          this.close()
        } else if (jobResponse.error) {
          this.errorService.handleError(JobLoaderModalComponent.name, "ngOnInit", new Error(jobResponse.error))
          this.close(jobResponse.error)
        }
      }); 
    }, 1000);
  }

  cancel() {
    this.moduleService.stopJob(this.jobID).subscribe(
      {
        next: (result) => {
          this.close()
        },
        error: (err) => {
          this.errorService.handleError(JobLoaderModalComponent.name, "cancel", err)
          this.close()
        }
      }
    )
  }

  close(errorMessage: string | undefined = undefined) {
    clearInterval(this.interval)
    this.dialogRef.close(errorMessage)
  }
}
