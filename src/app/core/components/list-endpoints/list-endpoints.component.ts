import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { concatMap, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { CoreEndpoint, CoreEndpointsResponse } from 'src/app/endpoints/models/endpoints';
import { CoreManagerService } from '../../services/core-manager/core-manager.service';
import { ErrorService } from '../../services/util/error.service';
import { UtilService } from '../../services/util/util.service';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'list-endpoints',
  templateUrl: './list-endpoints.component.html',
  styleUrls: ['./list-endpoints.component.css']
})
export class ListEndpointsComponent implements OnInit {
  dataSource = new MatTableDataSource<CoreEndpoint>();
  dataSourceAlias = new MatTableDataSource<CoreEndpoint>();

  interval: any
  ready: Boolean = false;
  init: Boolean = true;
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['url', 'add']
  displayColumnsAlias = ['select', 'url', 'delete']
  selection = new SelectionModel<string>(true, []);
  location = location
  @Input() deploymentID!: string

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
          const generatedEndpoints: CoreEndpoint[] = []
          const aliasEndpoints: CoreEndpoint[] = []
          
          endpoints.forEach(endpoint => {
            if(endpoint.type === 1) {
              aliasEndpoints.push(endpoint)
            } else if(endpoint.type === 0) {
              generatedEndpoints.push(endpoint)
            }
          });

          this.dataSource.data = generatedEndpoints;
          this.dataSourceAlias.data = aliasEndpoints;
          this.ready = true
        }, 
        error: (err) => {
          if(!background) {
            this.errorService.handleError(ListEndpointsComponent.name, "loadServices", err)
          }
          this.ready = true
        }
      }
    )
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const currentViewed = this.dataSourceAlias.connect().value.length;
    return numSelected === currentViewed;
  }

  masterToggle() {
    if(this.isAllSelected()) {
      this.selectionClear();
    } else {
      this.selectionClear();
      this.dataSourceAlias.connect().value.forEach((row) => this.selection.select(row.id));
    }
  }

  selectionClear(): void {
    this.selection.clear();
  }

  deleteEndpoint(endpointID: string) {
    this.ready = false;
    this.stopPeriodicRefresh()
    this.coreService.deleteEndpoint(endpointID).pipe(
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
    ).subscribe({
      next: (_) => {
        this.ready = true
        this.loadEndpoints(true)
        this.startPeriodicRefresh()
      },
      error: (err) => {
        this.errorService.handleError(ListEndpointsComponent.name, "deleteEndpoint", err)
        this.ready = true
        this.loadEndpoints(true)
        this.startPeriodicRefresh()
      }      
    })
  }

  deleteMultiple() {
    this.ready = false;
    this.stopPeriodicRefresh()
    const ids: string[] = [];
    this.selection.selected.forEach((deployment_id: string) => {
      ids.push(deployment_id);
    });
    this.coreService.deleteEndpoints(ids).pipe(
      concatMap((jobID: string) => {
        const message = 'Delete endpoints'
        return this.utilsService.checkJobStatus(jobID, message, "core-manager")
      }),
      concatMap(result => {
        if(!result.success) {
          return throwError(() => new Error(result.error))
        }
        return of(true)
      })
    ).subscribe({
      next: (_) => {
        this.ready = true
        this.loadEndpoints(true)
        this.startPeriodicRefresh()
      },
      error: (err) => {
        this.errorService.handleError(ListEndpointsComponent.name, "deleteMultiple", err)
        this.ready = true
        this.loadEndpoints(true)
        this.startPeriodicRefresh()
      }      
    })
  }
}
