import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Observable} from 'rxjs';
import {ModuleManagerService} from 'src/app/core/services/module-manager/module-manager-service.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {Job as CoreManagerJob} from 'src/app/system/models/job.model';
import {isJobDone, JobResult} from 'src/app/core/models/jobs';
import {CoreManagerService} from '../../services/core-manager/core-manager.service';
import {SpinnerComponent} from '../spinner/spinner.component';

// Result endpoint to query once a module-manager job has ended.
export type JobResultKind =
  'modules-change' | 'deployments' | 'deployments-update' | 'deployments-delete' | 'repositories-refresh';

@Component({
  selector: 'app-job-loader-modal',
  templateUrl: './job-loader-modal.component.html',
  styleUrls: ['./job-loader-modal.component.css'],
  imports: [SpinnerComponent],
})
export class JobLoaderModalComponent implements OnInit {
  jobID!: string;
  interval: any;
  jobIsCompleted = false;
  message!: string;
  service!: string;
  resultKind?: JobResultKind;
  private closing = false;

  constructor(
    @Inject('ModuleManagerService') private moduleService: ModuleManagerService,
    @Inject('CoreManagerService') private coreService: CoreManagerService,
    private errorService: ErrorService,
    public dialogRef: MatDialogRef<JobLoaderModalComponent>,
    @Inject(MAT_DIALOG_DATA) data: any,
  ) {
    this.jobID = data.jobID;
    this.message = data.message;
    this.service = data.service;
    this.resultKind = data.resultKind;
  }

  ngOnInit(): void {
    // TODO better interal + obsersable
    this.interval = setInterval(() => {
      if (this.service === 'core-manager') {
        this.checkCoreManagerJob();
      } else {
        this.checkModuleManagerJob();
      }
    }, 1000);
  }

  // module-manager jobs carry no outcome themselves: poll until "end" is set,
  // then fetch the typed result from the matching /results endpoint
  checkModuleManagerJob() {
    this.moduleService.getJobStatus(this.jobID).subscribe({
      next: (job) => {
        if (isJobDone(job) && !this.closing) {
          this.closing = true;
          this.fetchResultAndClose();
        }
      },
      error: (error) => {
        this.close(false, undefined, error);
      },
    });
  }

  fetchResultAndClose() {
    if (!this.resultKind) {
      this.close(true, undefined);
      return;
    }
    let obs: Observable<JobResult>;
    switch (this.resultKind) {
      case 'modules-change':
        obs = this.moduleService.getModulesChangeResult(this.jobID);
        break;
      case 'deployments':
        obs = this.moduleService.getDeploymentsResult(this.jobID);
        break;
      case 'deployments-update':
        obs = this.moduleService.getDeploymentsUpdateResult(this.jobID);
        break;
      case 'deployments-delete':
        obs = this.moduleService.getDeploymentsDeleteResult(this.jobID);
        break;
      case 'repositories-refresh':
        obs = this.moduleService.getRepositoriesRefreshResult(this.jobID);
        break;
    }
    obs.subscribe({
      next: (result) => {
        // has_error marks an aborted job; partial per-item failures are
        // reported inside the result and are up to the caller to present
        if (result.has_error) {
          this.errorService.handleError(
            JobLoaderModalComponent.name,
            'fetchResultAndClose',
            new Error(result.error_msg),
          );
          this.close(false, result, result.error_msg);
        } else {
          this.close(true, result, undefined);
        }
      },
      error: (error) => {
        this.close(false, undefined, error);
      },
    });
  }

  checkCoreManagerJob() {
    this.coreService.getJobStatus(this.jobID).subscribe({
      next: (jobResponse: CoreManagerJob) => {
        if (jobResponse.completed && !jobResponse.error) {
          this.close(true, jobResponse.result, undefined);
        } else if (jobResponse.error) {
          this.errorService.handleError(
            JobLoaderModalComponent.name,
            'checkCoreManagerJob',
            new Error(jobResponse.error.message),
          );
          this.close(false, undefined, jobResponse.error.message);
        }
      },
      error: (error) => {
        this.close(false, undefined, error);
      },
    });
  }

  cancel() {
    const obs =
      this.service === 'core-manager' ? this.coreService.stopJob(this.jobID) : this.moduleService.stopJob(this.jobID);
    obs.subscribe({
      next: (result) => {
        this.close(true, undefined);
      },
      error: (err) => {
        this.errorService.handleError(JobLoaderModalComponent.name, 'cancel', err);
        this.close(false, undefined, err);
      },
    });
  }

  close(success: boolean, result?: any, errorMessage: string | undefined = undefined) {
    clearInterval(this.interval);
    this.dialogRef.close({
      success: success,
      result: result,
      error: errorMessage,
    });
  }
}
