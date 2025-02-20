import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow, MatRowDef, MatTable, MatTableDataSource
} from "@angular/material/table";
import {MatCheckbox} from "@angular/material/checkbox";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {NgIf} from "@angular/common";
import {SpinnerComponent} from "../../../../core/components/spinner/spinner.component";
import {CoreService, CoreServicesResponse} from "../../../models/services";
import {MatSort} from "@angular/material/sort";
import {SelectionModel} from "@angular/cdk/collections";
import {CoreManagerService} from "../../../../core/services/core-manager/core-manager.service";
import {ErrorService} from "../../../../core/services/util/error.service";
import {Router} from "@angular/router";
import {UtilService} from "../../../../core/services/util/util.service";
import {concatMap, map, of, throwError} from "rxjs";
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatDivider} from "@angular/material/divider";

@Component({
  selector: 'app-container-list',
  standalone: true,
  imports: [
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatIconButton,
    MatRow,
    MatRowDef,
    MatTable,
    NgIf,
    SpinnerComponent,
    MatHeaderCellDef,
    MatCard,
    MatCardContent,
    MatCardTitle,
    MatCardHeader,
    MatDivider
  ],
  templateUrl: './container-list.component.html',
  styleUrl: './container-list.component.css'
})
export class ContainerListComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<CoreService>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['name', 'version', 'status', 'restart', 'logs']
  selection = new SelectionModel<string>(true, []);

  constructor(
    private coreService: CoreManagerService,
    private errorService: ErrorService,
    private router: Router,
    private utilsService: UtilService
  ) {
  }

  ngOnInit(): void {
    this.loadServices(false);
    this.startPeriodicRefresh()
    this.init = false
  }

  ngOnDestroy(): void {
    this.stopPeriodicRefresh()
  }

  startPeriodicRefresh() {
    this.stopPeriodicRefresh()
    this.interval = setInterval(() => {
      this.loadServices(true);
    }, 5000);
  }

  stopPeriodicRefresh() {
    clearTimeout(this.interval)
  }

  loadServices(background: boolean): void {
    this.coreService.getServices().pipe(
      map((servicesResponse: CoreServicesResponse) => {
        const services: CoreService[] = []
        for (const [key, value] of Object.entries(servicesResponse)) {
          services.push(value)
        }
        return services
      })
    ).subscribe(
      {
        next: (services: CoreService[]) => {
          if (!services) {
            this.dataSource.data = []
          } else {
            this.dataSource.data = services
          }
          this.ready = true
        },
        error: (err) => {
          if (!background) {
            this.errorService.handleError(ContainerListComponent.name, "loadServices", err)
          }
          this.ready = true
        }
      }
    )
  }

  restart(serviceID: string) {
    this.coreService.reloadService(serviceID).pipe(
      concatMap((jobId: string) => {
        const message = 'Reload service ' + serviceID
        return this.utilsService.checkJobStatus(jobId, message, "core-manager")
      }),
      concatMap(result => {
        if (!result.success) {
          return throwError(() => new Error(result.error))
        }
        return of(true)
      })
    ).subscribe({
      next: (_) => {

      },
      error: (err) => {
        this.errorService.handleError(ContainerListComponent.name, "restart", err)
      }
    })
  }

  showLogs(containerID: string) {
    this.router.navigate(["core/services/container-logs/" + containerID])
  }
}
