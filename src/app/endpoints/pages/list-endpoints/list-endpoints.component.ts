import { Component, OnInit, ViewChild } from '@angular/core';
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
export class ListEndpointsComponent implements OnInit {
  deploymentIDs: string[] = []

  constructor(
    private coreService: CoreManagerService,
    private errorService: ErrorService,
  ) {}

  ngOnInit(): void {
      this.loadDeploymentsWithEndpoints()
  }

  loadDeploymentsWithEndpoints() {
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
          if(endpoints) {
            endpoints.forEach(endpoint => {
              if(this.deploymentIDs.indexOf(endpoint.ref) === -1) {
                this.deploymentIDs.push(endpoint.ref);
              }
            });
          } 
        }, 
        error: (err) => {
          this.errorService.handleError(ListEndpointsComponent.name, "loadDeploymentsWithEndpoints", err)
        }
      }
    )
  }
}