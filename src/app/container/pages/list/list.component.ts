import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { Container } from '../../models/container';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnDestroy {
  dataSource = new MatTableDataSource<Container>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['id', 'ref', 'status', 'alias', 'state', 'logs']
  deploymentID!: string
  
  constructor(
    public dialog: MatDialog, 
    @Inject("ModuleManagerService") private moduleService: ModuleManagerService, 
    public utilsService: UtilService,
    private errorService: ErrorService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.params.subscribe(params => {
      this.deploymentID = params['id']
      this.loadContainer(this.deploymentID);
      this.interval = setInterval(() => { 
        this.loadContainer(this.deploymentID); 
      }, 5000);
      this.init = false
    })
  }

  ngOnDestroy(): void {
      clearTimeout(this.interval)
  }

  loadContainer(deploymentID: string): void {
    // Get containers from deployment info, then merge with container healths
    this.moduleService.loadDeployment(deploymentID, true).subscribe(
      {
        next: (deployment) => {
          var containers = []
          if(!!deployment.containers) {
            for(const [_, container] of Object.entries(deployment.containers)) {
              containers.push(container)
            }
          }
          
          this.dataSource.data = containers
          this.ready = true
        }, 
        error: (err) => {
          this.errorService.handleError(ListComponent.name, "loadInstances", err)
          this.ready = true
        }
      }
    )
  }

  showLogs(containerID: string) {
    this.router.navigate(["/deployments/containers/" + containerID + "/logs"])
  }

}
