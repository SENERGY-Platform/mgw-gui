import { Component, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { concatMap, map, of, throwError } from 'rxjs';
import { CoreService, CoreServicesResponse } from 'src/app/mgw-core/models/services';
import { CoreManagerService } from 'src/app/core/services/core-manager/core-manager.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';
import { UtilService } from 'src/app/core/services/util/util.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListCoreServicesComponent {
  dataSource = new MatTableDataSource<CoreService>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['select', 'name','restart']
  selection = new SelectionModel<string>(true, []);

  constructor(
    private coreService: CoreManagerService,
    private errorService: ErrorService,
    private router: Router,
    private utilsService: UtilService
  ) {}

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
          if(!services) {
            this.dataSource.data = []
          } else {
            this.dataSource.data = services
          }
          this.ready = true
        }, 
        error: (err) => {
          if(!background) {
            this.errorService.handleError(ListCoreServicesComponent.name, "loadServices", err)
          }
          this.ready = true
        }
      }
    )
  }

  restartMultiple() {}

  restart(serviceID: string) {
    this.coreService.reloadService(serviceID).pipe(
      concatMap((jobId: string) => {
        const message = 'Reload service ' + serviceID
        return this.utilsService.checkJobStatus(jobId, message, "core-manager")
      }),
      concatMap(result => {
        if(!result.success) {
          return throwError(() => new Error(result.error))
        }
        return of(true)
    })
    ).subscribe({
      next: (_) => {
        
      },
      error: (err) => {
        this.errorService.handleError(ListCoreServicesComponent.name, "restart", err)
      }
    })
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const currentViewed = this.dataSource.connect().value.length;
    return numSelected === currentViewed;
  }

  masterToggle() {
    if(this.isAllSelected()) {
      this.selectionClear();
    } else {
      this.selectionClear();
      this.dataSource.connect().value.forEach((row) => this.selection.select(row.name));
    }
  }

  selectionClear(): void {
      this.selection.clear();
  }

  showLogs(containerID: string) {
    this.router.navigate(["/deployments/containers/" + containerID + "/logs"])
  }

}
