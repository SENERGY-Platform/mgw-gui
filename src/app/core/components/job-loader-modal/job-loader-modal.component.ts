import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { Job } from 'src/app/mgw-core/models/job.model';
import { CoreManagerService } from '../../services/core-manager/core-manager.service';

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
  service!: string

  constructor(
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    @Inject("CoreManagerService") private coreService: CoreManagerService,
    private errorService: ErrorService,
    public dialogRef: MatDialogRef<JobLoaderModalComponent>,
    @Inject(MAT_DIALOG_DATA) data: any
  ) {
    this.jobID = data.jobID
    this.message = data.message
    this.service = data.service
  }

  ngOnInit(): void {
    // TODO better interal + obsersable
    this.interval = setInterval(() => { 
      let obs: Observable<Job> = this.moduleService.getJobStatus(this.jobID)
      if(this.service === "core-manager") {
        obs = this.coreService.getJobStatus(this.jobID)
      }

      obs.subscribe({
        next: jobResponse => {
          if(jobResponse.completed && !jobResponse.error) {
            this.close(true, jobResponse.result, undefined)
          } else if (jobResponse.error) {
            this.errorService.handleError(JobLoaderModalComponent.name, "ngOnInit", new Error(jobResponse.error.message))
            this.close(false, undefined, jobResponse.error.message)
          }
        },
        error: (error) => {
          this.close(false, undefined, error)
        }
      }) 
    }, 1000);
  }

  cancel() {
    this.moduleService.stopJob(this.jobID).subscribe(
      {
        next: (result) => {
          this.close(true, undefined)
        },
        error: (err) => {
          this.errorService.handleError(JobLoaderModalComponent.name, "cancel", err)
          this.close(false, undefined, err)
        }
      }
    )
  }

  close(success: boolean, result?: string, errorMessage: string | undefined = undefined) {
    clearInterval(this.interval)
    this.dialogRef.close({
      "success": success,
      'result': result,
      "error": errorMessage
    })
  }
}
