import {Component, Inject, OnDestroy} from '@angular/core';
import {MatSlideToggleChange, MatSlideToggle} from '@angular/material/slide-toggle';
import {ActivatedRoute, Router} from '@angular/router';
import {
  ContainerEngineManagerService
} from 'src/app/core/services/container-engine-manager/container-engine-manager.service';
import {ErrorService} from 'src/app/core/services/util/error.service';
import {UtilService} from 'src/app/core/services/util/util.service';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {NgIf} from '@angular/common';
import {Highlight} from 'ngx-highlightjs';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css'],
  standalone: true,
  imports: [MatSlideToggle, FormsModule, MatFormField, MatLabel, MatInput, NgIf, Highlight]
})
export class LogsComponent implements OnDestroy {
  containerID!: string
  ready: boolean = false
  init: boolean = true
  interval: any
  maxLines: any = 100
  logs: string = ""
  autoRefreshEnabled = true

  constructor(
    @Inject("ContainerEngineManagerService") private containerService: ContainerEngineManagerService,
    private errorService: ErrorService,
    private route: ActivatedRoute,
  ) {
    this.route.params.subscribe(params => {
      this.containerID = params['containerId']
      this.getLogs();
      this.init = false
      this.startAutoRefresh()
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

  startAutoRefresh() {
    this.interval = setInterval(() => {
      this.getLogs();
    }, 5000);
  }

  autoRefreshToggleChanged(event: MatSlideToggleChange) {
    if (event.checked) {
      this.startAutoRefresh()
    } else {
      clearTimeout(this.interval)
    }
  }

  maxLinesChanges(newValue: Event) {
    this.maxLines = newValue
    this.getLogs()
  }
}
