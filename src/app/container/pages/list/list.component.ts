import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleManagerService } from 'src/app/core/services/module-manager/module-manager-service.service';
import { ErrorService } from 'src/app/core/services/util/error.service';
import { UtilService } from 'src/app/core/services/util/util.service';
import { DeploymentHealth } from 'src/app/deployments/models/deployment_models';
import { ContainerHealth } from '../../models/container';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnDestroy {
  dataSource = new MatTableDataSource<ContainerHealth>();
  ready: Boolean = false;
  init: Boolean = true;
  interval: any
  @ViewChild(MatSort) sort!: MatSort;
  displayColumns = ['id', 'ref', 'logs', 'state']
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
      this.loadInstances(this.deploymentID);
      this.interval = setInterval(() => { 
        this.loadInstances(this.deploymentID); 
      }, 5000);
      this.init = false
    })
  }

  ngOnDestroy(): void {
      clearTimeout(this.interval)
  }

  loadInstances(deploymentID: string): void {
    this.moduleService.getDeploymentHealth(deploymentID).subscribe(
      {
        next: (deploymentHealth) => {
          this.dataSource.data = deploymentHealth.containers
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
    this.router.navigate(["/instances/containers/" + containerID + "/logs"])
  }

}
