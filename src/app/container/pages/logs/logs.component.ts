import { Component, Inject, OnDestroy } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router } from '@angular/router';
import { ContainerEngineManagerService } from 'src/app/core/services/container-engine-manager/container-engine-manager.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { UtilService } from 'src/app/core/services/util/util.service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent implements OnDestroy {
  containerID!: string 
  ready: boolean = false
  init: boolean = true
  interval: any
  maxLines: any = 100
  logs: string = ""

  constructor(
    @Inject("ContainerEngineManagerService") private containerService: ContainerEngineManagerService, 
    public utilsService: UtilService,
    private errorService: ErrorService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.params.subscribe(params => {
      this.containerID = params['id']
      this.getLogs();
      this.init = false
    })
  }

  getLogs() {
    this.containerService.getContainerLogs(this.containerID, this.maxLines).subscribe(
      {
        next: (logs) => {
          this.logs = logs
          this.ready = true
        }, 
        error: (err) => {
          this.errorService.handleError(LogsComponent.name, "getLogs", err)
          this.ready = true
        }
      }
    )
  }

  ngOnDestroy(): void {
    clearTimeout(this.interval)
  }

  autoRefreshToggleChanged(event: MatSlideToggleChange) {
    if(event.checked) {
      this.interval = setInterval(() => { 
        this.getLogs(); 
      }, 5000);
    } else {
      clearTimeout(this.interval)
    }
  }

  maxLinesChanges(newValue: Event) {
    this.maxLines = newValue
    this.getLogs()
  }
}
