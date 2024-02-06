import { Component, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { concatMap, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { CoreService, CoreServicesResponse } from 'src/app/mgw-core/models/services';
import { CoreManagerService } from 'src/app/core/services/core-manager/core-manager.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';
import { CoreEndpoint, CoreEndpointsResponse } from '../../models/endpoints';
import { UtilService } from 'src/app/core/services/util/util.service';

@Component({
  selector: 'app-list',
  templateUrl: './list-endpoints.component.html',
  styleUrls: ['./list-endpoints.component.css']
})
export class ListEndpointsComponent {
  dataSource = new MatTableDataSource<CoreEndpoint>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['select', 'name', 'ref', 'host', 'port', 'type', 'int_path', 'ext_path', 'add', 'delete']
  selection = new SelectionModel<string>(true, []);

  constructor(
    private coreService: CoreManagerService,
    private utilsService: UtilService,
    private errorService: ErrorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEndpoints(false);
    this.startPeriodicRefresh()
    this.init = false
  }

  ngOnDestroy(): void {
    this.stopPeriodicRefresh()
  }

  startPeriodicRefresh() {
    this.stopPeriodicRefresh()
    this.interval = setInterval(() => { 
      this.loadEndpoints(true);
    }, 5000);
  }


  stopPeriodicRefresh() {
    clearTimeout(this.interval)
  }

  loadEndpoints(background: boolean): void {
    this.coreService.getEndpoints().pipe(
      map((endpointsResponse: CoreEndpointsResponse) => {
        const services: CoreEndpoint[] = []
        for (const [key, value] of Object.entries(endpointsResponse)) {
          services.push(value)
        }
        return services
      })
    ).subscribe(
      {
        next: (endpoints: CoreEndpoint[]) => {
          if(!endpoints) {
            this.dataSource.data = []
          } else {
            this.dataSource.data = endpoints
          }
        }, 
        error: (err) => {
          if(!background) {
            this.errorService.handleError(ListEndpointsComponent.name, "loadServices", err)
          }
        },
        complete: () => {
          this.ready = true
        }
      }
    )
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
      this.dataSource.connect().value.forEach((row) => this.selection.select(row.id));
    }
  }

  selectionClear(): void {
    this.selection.clear();
  }

  deleteEndpoint(endpointID: string) {
    this._delete([endpointID])
  }

  deleteMultiple() {
    const ids: string[] = [];
    this.selection.selected.forEach((deployment_id: string) => {
      ids.push(deployment_id);
    });
    this._delete(ids)
  }

  _delete(ids: string[]) {
    this.ready = false;
    this.stopPeriodicRefresh()
    const jobs: Observable<any>[] = []
    ids.forEach(id => {
      jobs.push(this.coreService.deleteEndpoint(id).pipe(
        concatMap((jobID: string) => {
          const message = 'Delete endpoint'
          return this.utilsService.checkJobStatus(jobID, message, "core-manager")
        }),
        concatMap(result => {
          if(!result.success) {
            return throwError(() => new Error(result.error))
          }
          return of(true)
        })
      ))
    });

    forkJoin(jobs).subscribe({
      next: (resp) => {
        this.ready = true
        this.loadEndpoints(true)
        this.startPeriodicRefresh()
      },
      error: (err) => {
        this.errorService.handleError(ListEndpointsComponent.name, "_delete", err)
        this.ready = true
        this.loadEndpoints(true)
        this.startPeriodicRefresh()
      }
    })
  }
}