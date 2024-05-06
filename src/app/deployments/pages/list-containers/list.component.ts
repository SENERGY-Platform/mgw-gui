import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap, map, of } from 'rxjs';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { Container, SubDeploymentContainer } from '../../../container/models/container';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListContainersComponent implements OnDestroy {
  dataSource = new MatTableDataSource<Container | SubDeploymentContainer>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['status', 'id', 'alias', 'state', 'logs']
  deploymentID!: string
  subDeploymentID = ""
  isSubDeployment = false;
  
  constructor(
    public dialog: MatDialog, 
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    public utilsService: UtilService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.getDeploymentIDs().pipe(
      concatMap(_ => {
        this.isSubDeployment = this.route.snapshot.paramMap.get("sub") === 'true';
        this.startPeriodicLoad();
        return this.loadContainers();
      })
    ).subscribe({
      next: (_) => {
        this.ready = true
        this.init = false;
      },
      error: (_) => {
        this.ready = true
        this.init = false;
      }
    })
  }

  startPeriodicLoad() {
    this.interval = setInterval(() => { 
      this.loadContainers(); 
    }, 5000);
  }

  getDeploymentIDs() {
    return this.route.params.pipe(
      map(params => {
        this.deploymentID = params['deploymentId']
        this.subDeploymentID = params['subDeploymentId']
      })
    )
  } 

  ngOnDestroy(): void {
      clearTimeout(this.interval)
  }

  setupColums() {
    if(this.isSubDeployment) {
      this.displayColumns.push('ref')
    }
  }

  loadContainers() {
    if(this.isSubDeployment) {
      return this.loadSubDeploymentContainer()
    } else {
      return this.loadParentContainers()
    }
  }

  loadParentContainers() {
    var obs = this.moduleService.loadDeployment(this.deploymentID, true, false)
    return obs.pipe(
      map((deployment) => {
          var containers = []
          if(!!deployment.containers) {
            for(const [_, container] of Object.entries(deployment.containers)) {
              containers.push(container)
            }
          }
          
          this.dataSource.data = containers
          return of(null);
      })
    )
  }

  loadSubDeploymentContainer() {
    var obs = this.moduleService.getSubDeployment(this.deploymentID, this.subDeploymentID)
    return obs.pipe(
      map((deployment) => {
        console.log(deployment)
          this.dataSource.data = [deployment.container]
          return of(null);
      })
    )
  }

  showLogs(containerID: string) {
    this.router.navigate(["/containers/" + containerID + "/logs"])
  }

}
