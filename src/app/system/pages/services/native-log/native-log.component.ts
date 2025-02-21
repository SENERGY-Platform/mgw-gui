import {Component, Inject, OnDestroy} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MatSlideToggle, MatSlideToggleChange} from "@angular/material/slide-toggle";
import {NgIf} from "@angular/common";
import {UtilService} from "../../../../core/services/util/util.service";
import {ErrorService} from "../../../../core/services/util/error.service";
import {ActivatedRoute, Router} from "@angular/router";
import {CoreManagerService} from "../../../../core/services/core-manager/core-manager.service";
import {Highlight} from "ngx-highlightjs";

@Component({
  selector: 'app-native-log',
  standalone: true,
  imports: [
    FormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatSlideToggle,
    NgIf,
    Highlight
  ],
  templateUrl: './native-log.component.html',
  styleUrl: './native-log.component.css'
})
export class NativeLogComponent implements OnDestroy{
  logID!: string
  ready: boolean = false
  init: boolean = true
  interval: any
  maxLines: any = 100
  logs: string = ""
  autoRefreshEnabled = true

  constructor(
    @Inject("CoreManagerService") private coreManagerService: CoreManagerService,
    private errorService: ErrorService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.params.subscribe(params => {
      this.logID = params['log_id']
      this.getLog();
      this.init = false
      this.startAutoRefresh()
    })
  }

  getLog() {
    this.coreManagerService.getLog(this.logID, this.maxLines).subscribe(
      {
        next: (logs) => {
          this.logs = logs
          this.ready = true
        },
        error: (err) => {
          this.errorService.handleError(NativeLogComponent.name, "getLog", err)
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
      this.getLog();
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
    this.getLog()
  }
}
